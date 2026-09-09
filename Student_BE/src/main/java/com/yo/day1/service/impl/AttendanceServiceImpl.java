package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.*;
import com.yo.day1.domain.enums.AttendanceStatus;
import com.yo.day1.domain.enums.EnrollmentStatus;
import com.yo.day1.domain.enums.NotificationRecipientType;
import com.yo.day1.domain.enums.NotificationType;
import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.dto.attendance.*;
import com.yo.day1.dto.student.StudentResponse;
import com.yo.day1.repository.*;
import com.yo.day1.service.AttendanceService;
import com.yo.day1.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final NotificationRepository notificationRepository;
    private final StudentRepository studentRepository;
    private final CourseClassRepository courseClassRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AuthService authService;
    private final ModelMapper mapper;

    @Transactional
    @Override
    public AttendanceResponse create(AttendanceCreateRequest request, String username) {
        CourseClass courseClass = courseClassRepository.findById(request.getCourseClassId())
                .orElseThrow(() -> new NotFoundExeception("Course class not found: " + request.getCourseClassId()));
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new NotFoundExeception("Student not found: " + request.getStudentId()));

        // Rule: không điểm danh học viên đã hủy học hoặc tạm ngưng
        if (student.getStatus() == StudentStatus.DROPPED) {
            throw new BadRequestException("Không thể điểm danh học viên đã hủy học");
        }
        if (student.getStatus() == StudentStatus.PAUSED) {
            throw new BadRequestException("Không thể điểm danh học viên đang tạm ngưng");
        }

        // Rule: học viên phải có enrollment ACTIVE trong lớp này
        if (!enrollmentRepository.existsByStudentIdAndCourseClassIdAndStatus(
                request.getStudentId(), request.getCourseClassId(), EnrollmentStatus.ACTIVE)) {
            throw new BadRequestException("Học viên không có trong danh sách lớp học này");
        }

        validateAttendanceDate(courseClass, request.getAttendanceDate());

        java.util.Optional<Attendence> existingOpt = attendanceRepository.findByCourseClassIdAndStudentIdAndAttendanceDate(
                request.getCourseClassId(), request.getStudentId(), request.getAttendanceDate());

        Users recorder = authService.findActiveUserByUsername(username);
        Attendence attendance;

        if (existingOpt.isPresent()) {
            attendance = existingOpt.get();
            attendance.setStatus(request.getStatus());
            attendance.setNote(request.getNote());
            attendance.setRecordedByUser(recorder);
        } else {
            attendance = new Attendence();
            attendance.setStudent(student);
            attendance.setCourseClass(courseClass);
            attendance.setAttendanceDate(request.getAttendanceDate());
            attendance.setStatus(request.getStatus());
            attendance.setNote(request.getNote());
            attendance.setRecordedByUser(recorder);
        }

        Attendence saved;
        try {
            saved = attendanceRepository.save(attendance);
        } catch (DataIntegrityViolationException ex) {
            if (attendanceRepository.existsByCourseClassIdAndStudentIdAndAttendanceDate(
                    request.getCourseClassId(), request.getStudentId(), request.getAttendanceDate())) {
                throw new BadRequestException(duplicateAttendanceMessage(request));
            }
            throw ex;
        }

        if (request.getStatus() == AttendanceStatus.ABSENT && saved.getStudent().getParent() != null) {
            Notification notification = new Notification();
            notification.setRecipientType(NotificationRecipientType.PARENT);
            notification.setRecipientRefId(saved.getStudent().getParent().getId());
            notification.setStudent(saved.getStudent());
            notification.setType(NotificationType.ABSENCE);
            notification.setTitle("Thông báo vắng học");
            notification.setContent("Học viên " + saved.getStudent().getFullName() + " vắng buổi học ngày "
                    + saved.getAttendanceDate() + ".");
            notification.setRelatedEntityType("attendance");
            notification.setRelatedEntityId(saved.getId());
            notificationRepository.save(notification);
        }

        return toResponse(saved);
    }

    @Transactional
    @Override
    public List<AttendanceResponse> saveBatch(AttendanceBatchRequest request, String username) {
        return request.getItems().stream().map(item -> {
            AttendanceCreateRequest single = new AttendanceCreateRequest();
            single.setCourseClassId(request.getCourseClassId());
            single.setStudentId(item.getStudentId());
            single.setAttendanceDate(request.getAttendanceDate());
            single.setStatus(item.getStatus());
            single.setNote(item.getNote());
            return create(single, username);
        }).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<AttendanceResponse> findByClassId(Long classId) {
        return findByClassId(classId, null);
    }

    @Transactional(readOnly = true)
    @Override
    public List<AttendanceResponse> findByClassId(Long classId, LocalDate date) {
        courseClassRepository.findById(classId);
        if (date != null) {
            return attendanceRepository.findByCourseClassIdAndAttendanceDate(classId, date)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }
        return attendanceRepository.findByCourseClassId(classId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<ClassAttendanceDailyDto> getClassesByDate(LocalDate date) {
        List<CourseClass> allClasses = courseClassRepository.findAll();

        return allClasses.stream()
                .filter(c -> c.getStatus() != null && c.getStatus() != com.yo.day1.domain.enums.ClassStatus.CLOSED)
                .filter(c -> {
                    boolean dateInRange = !date.isBefore(c.getStartDate())
                            && (c.getEndDate() == null || !date.isAfter(c.getEndDate()));
                    boolean matchesDay = matchesScheduledWeekday(date,
                            c.getScheduleSlot() != null ? (int) c.getScheduleSlot().getWeekday() : null);
                    boolean hasAttendance = !attendanceRepository
                            .findByCourseClassIdAndAttendanceDate(c.getId(), date).isEmpty();
                    return (dateInRange && matchesDay) || hasAttendance;
                })
                .map(c -> {
                    List<Attendence> attendances = attendanceRepository
                            .findByCourseClassIdAndAttendanceDate(c.getId(), date);
                    List<Student> eligible = attendanceRepository.findEligibleStudentsForAttendance(c.getId());
                    int totalStudents = eligible.size();
                    int attendedCount = attendances.size();
                    int presentCount = (int) attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
                    int absentCount = (int) attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
                    int lateCount = (int) attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
                    int excusedCount = (int) attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.EXCUSED).count();
                    boolean isAttended = attendedCount > 0;

                    return new ClassAttendanceDailyDto(
                            c.getId(),
                            c.getClassCode(),
                            c.getName(),
                            c.getCourse() != null ? c.getCourse().getId() : null,
                            c.getCourse() != null ? c.getCourse().getCourseName() : null,
                            c.getScheduleSlot() != null ? c.getScheduleSlot().getSlotCode() : null,
                            c.getRoom() != null ? c.getRoom().getName() : null,
                            c.getMainTeacher() != null ? c.getMainTeacher().getId() : null,
                            c.getMainTeacher() != null ? c.getMainTeacher().getFullName() : null,
                            totalStudents,
                            attendedCount,
                            presentCount,
                            absentCount,
                            lateCount,
                            excusedCount,
                            isAttended
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<StudentAttendanceRowDto> getAttendanceMatrix(Long classId, int year, int month) {
        List<Attendence> list = attendanceRepository
                .findByCourseClassIdAndAttendanceDateYearAndAttendanceDateMonthValue(classId, year, month);
        Map<Long, StudentAttendanceRowDto> map = new LinkedHashMap<>();
        for (Attendence a : list) {
            Long sid = a.getStudent().getId();
            map.computeIfAbsent(sid, k -> {
                StudentAttendanceRowDto row = new StudentAttendanceRowDto();
                row.setStudentId(sid);
                row.setStudentName(a.getStudent().getFullName());
                row.setAttendanceByDate(new LinkedHashMap<>());
                return row;
            });
            map.get(sid).getAttendanceByDate().put(a.getAttendanceDate().toString(), a.getStatus().name());
        }
        return List.copyOf(map.values());
    }

    @Transactional(readOnly = true)
    @Override
    public List<StudentResponse> getEligibleStudents(Long classId) {
        return attendanceRepository.findEligibleStudentsForAttendance(classId)
                .stream()
                .map(s -> mapper.map(s, StudentResponse.class))
                .toList();
    }

    private void validateAttendanceDate(CourseClass courseClass, LocalDate attendanceDate) {
        if (attendanceDate.isBefore(courseClass.getStartDate())) {
            throw new BadRequestException("Attendance date must not be before class start date");
        }
        if (courseClass.getEndDate() != null && attendanceDate.isAfter(courseClass.getEndDate())) {
            throw new BadRequestException("Attendance date must not be after class end date");
        }
        if (courseClass.getScheduleSlot() != null
                && !matchesScheduledWeekday(attendanceDate, (int) courseClass.getScheduleSlot().getWeekday())) {
            throw new BadRequestException("Attendance date does not match the class schedule");
        }
    }

    private boolean matchesScheduledWeekday(LocalDate attendanceDate, Integer scheduledWeekday) {
        if (scheduledWeekday == null) return true;
        int isoWeekday = attendanceDate.getDayOfWeek().getValue();
        int vnStyleWeekday = isoWeekday == 7 ? 8 : isoWeekday + 1;
        return scheduledWeekday == vnStyleWeekday;
    }

    private String duplicateAttendanceMessage(AttendanceCreateRequest request) {
        return "Attendance already exists for student " + request.getStudentId()
                + " in class " + request.getCourseClassId()
                + " on " + request.getAttendanceDate();
    }

    private AttendanceResponse toResponse(Attendence a) {
        AttendanceResponse result = mapper.map(a, AttendanceResponse.class);
        result.setCourseClassId(a.getCourseClass().getId());
        result.setClassName(a.getCourseClass().getName());
        result.setStudentId(a.getStudent().getId());
        result.setStudentName(a.getStudent().getFullName());
        result.setStatus(a.getStatus().name());
        result.setRecordedByUserId(a.getRecordedByUser() != null ? a.getRecordedByUser().getId() : null);
        result.setRecordedByUsername(a.getRecordedByUser() != null ? a.getRecordedByUser().getUsername() : null);
        return result;
    }
}
