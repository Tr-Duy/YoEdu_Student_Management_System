package com.yo.day1.service.impl;

import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.entity.Room;
import com.yo.day1.domain.entity.ScheduleSlot;
import com.yo.day1.domain.entity.Teacher;
import com.yo.day1.domain.enums.ClassStatus;
import com.yo.day1.domain.spec.CourseClassSpec;
import com.yo.day1.dto.courseclass.CourseClassCreateRequest;
import com.yo.day1.dto.courseclass.CourseClassResponse;
import com.yo.day1.repository.*;
import com.yo.day1.service.CourseClassService;
import com.yo.day1.service.ScheduleConflictService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseClassServiceImpl implements CourseClassService {

    private final CourseClassRepository courseClassRepository;
    private final CourseRepository courseRepository;
    private final RoomRepository roomRepository;
    private final ScheduleSlotRepository scheduleSlotRepository;
    private final TeacherRepository teacherRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ScheduleConflictService scheduleConflictService;

    @Transactional(readOnly = true)
    @Override
    public Page<CourseClassResponse> search(String search, ClassStatus status, Long courseId, Long teacherId, Pageable pageable) {
        return courseClassRepository.findAll(CourseClassSpec.filter(search, status, courseId, teacherId), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    @Override
    public Page<CourseClassResponse> findAll(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return courseClassRepository
                    .findByNameContainingIgnoreCaseOrClassCodeContainingIgnoreCase(search, search, pageable)
                    .map(this::toResponse);
        }
        return courseClassRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    @Override
    public List<CourseClassResponse> findByCourseId(Long courseId) {
        return courseClassRepository.findByCourseId(courseId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<CourseClassResponse> findByStudentId(Long studentId) {
        return courseClassRepository.findActiveClassesByStudentId(studentId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public CourseClassResponse findById(Long id) {
        return toResponse(getCourseClass(id));
    }

    @Transactional
    @Override
    public CourseClassResponse create(CourseClassCreateRequest request) {
        CourseClass courseClass = new CourseClass();
        apply(courseClass, request);
        validateScheduleConflicts(courseClass, null);
        return toResponse(courseClassRepository.save(courseClass));
    }

    @Transactional
    @Override
    public CourseClassResponse update(Long id, CourseClassCreateRequest request) {
        CourseClass courseClass = getCourseClass(id);
        apply(courseClass, request);
        validateScheduleConflicts(courseClass, id);
        return toResponse(courseClassRepository.save(courseClass));
    }

    @Transactional
    @Override
    public void delete(Long id) {
        CourseClass cc = getCourseClass(id);
        if (enrollmentRepository != null && !enrollmentRepository.findByCourseClassId(id).isEmpty()) {
            throw new ConflictException("Không thể xóa lớp học đã có học viên đăng ký hoặc có lịch sử ghi danh.");
        }
        courseClassRepository.delete(cc);
    }

    @Transactional(readOnly = true)
    @Override
    public CourseClass getCourseClass(Long id) {
        return courseClassRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Course class not found: " + id));
    }

    private void apply(CourseClass c, CourseClassCreateRequest r) {
        // 1. Validate unique class code
        if (c.getId() == null) {
            if (courseClassRepository.existsByClassCode(r.classCode())) {
                throw new ConflictException("Mã lớp học đã tồn tại: " + r.classCode());
            }
        } else if (c.getClassCode() != null && !c.getClassCode().equalsIgnoreCase(r.classCode())) {
            if (courseClassRepository.existsByClassCode(r.classCode())) {
                throw new ConflictException("Mã lớp học đã tồn tại: " + r.classCode());
            }
        }

        // 2. Validate Room and capacity
        Room room = roomRepository.findById(r.roomId())
                .orElseThrow(() -> new NotFoundExeception("Room not found: " + r.roomId()));
        if (r.maxStudents() != null && room.getCapacity() > 0 && r.maxStudents() > room.getCapacity()) {
            throw new ConflictException(String.format("Sĩ số tối đa (%d) không được vượt quá sức chứa của phòng %s (%d chỗ).",
                    r.maxStudents(), room.getName(), room.getCapacity()));
        }

        // 3. Validate Teachers
        Teacher mainTeacher = teacherRepository.findById(r.mainTeacherId())
                .orElseThrow(() -> new NotFoundExeception("Teacher not found: " + r.mainTeacherId()));
        if (Boolean.TRUE.equals(mainTeacher.getDeleted()) || !Boolean.TRUE.equals(mainTeacher.getIsActive())) {
            throw new ConflictException("Giáo viên chính (" + mainTeacher.getFullName() + ") đã ngừng hoạt động, không thể phân công lớp mới.");
        }

        Teacher asstTeacher = null;
        if (r.assistantTeacherId() != null) {
            if (r.mainTeacherId().equals(r.assistantTeacherId())) {
                throw new ConflictException("Giáo viên chính và trợ giảng không được trùng nhau.");
            }
            asstTeacher = teacherRepository.findById(r.assistantTeacherId())
                    .orElseThrow(() -> new NotFoundExeception("Teacher not found: " + r.assistantTeacherId()));
            if (Boolean.TRUE.equals(asstTeacher.getDeleted()) || !Boolean.TRUE.equals(asstTeacher.getIsActive())) {
                throw new ConflictException("Trợ giảng (" + asstTeacher.getFullName() + ") đã ngừng hoạt động, không thể phân công lớp mới.");
            }
        }

        // 4. Validate Dates
        if (r.startDate() != null && r.endDate() != null && r.startDate().isAfter(r.endDate())) {
            throw new ConflictException("Ngày bắt đầu lớp học không được sau ngày kết thúc.");
        }

        c.setClassCode(r.classCode());
        c.setName(r.name());
        c.setCourse(courseRepository.findById(r.courseId())
                .orElseThrow(() -> new NotFoundExeception("Course not found: " + r.courseId())));
        c.setRoom(room);
        c.setScheduleSlot(scheduleSlotRepository.findById(r.scheduleSlotId())
                .orElseThrow(() -> new NotFoundExeception("Schedule slot not found: " + r.scheduleSlotId())));
        c.setMainTeacher(mainTeacher);
        c.setAssistantTeacher(asstTeacher);
        c.setStartDate(r.startDate());
        c.setEndDate(r.endDate());
        c.setMaxStudents(r.maxStudents());
        c.setTuitionFee(r.tuitionFee());
        c.setStatus(r.status());
    }

    private void validateScheduleConflicts(CourseClass c, Long excludeClassId) {
        ScheduleSlot slot = c.getScheduleSlot();
        if (slot == null) return;

        String roomConflict = scheduleConflictService.getRoomConflictMessage(c.getRoom().getId(), slot, c.getStartDate(), c.getEndDate(), excludeClassId);
        if (roomConflict != null) {
            throw new ConflictException("Không thể lưu lớp: " + roomConflict);
        }

        if (c.getMainTeacher() != null && c.getMainTeacher().getId() != null) {
            String mainTeacherConflict = scheduleConflictService.getTeacherConflictMessage(c.getMainTeacher().getId(), slot, c.getStartDate(), c.getEndDate(), excludeClassId);
            if (mainTeacherConflict != null) {
                throw new ConflictException("Không thể lưu lớp: " + mainTeacherConflict);
            }
        }

        if (c.getAssistantTeacher() != null && c.getAssistantTeacher().getId() != null) {
            if (c.getMainTeacher() != null && java.util.Objects.equals(c.getMainTeacher().getId(), c.getAssistantTeacher().getId())) {
                throw new ConflictException("Giáo viên chính và trợ giảng không được trùng nhau.");
            }
            String asstTeacherConflict = scheduleConflictService.getTeacherConflictMessage(c.getAssistantTeacher().getId(), slot, c.getStartDate(), c.getEndDate(), excludeClassId);
            if (asstTeacherConflict != null) {
                throw new ConflictException("Không thể lưu lớp (Trợ giảng): " + asstTeacherConflict);
            }
        }
    }

    private CourseClassResponse toResponse(CourseClass c) {
        int enrolledCount = enrollmentRepository != null ? 
            (int) enrollmentRepository.countByCourseClassIdAndStatus(c.getId(), com.yo.day1.domain.enums.EnrollmentStatus.ACTIVE) : 0;
            
        return new CourseClassResponse(
                c.getId(),
                c.getClassCode(),
                c.getName(),
                c.getCourse() != null ? c.getCourse().getId() : null,
                c.getCourse() != null ? c.getCourse().getCourseName() : null,
                c.getRoom() != null ? c.getRoom().getId() : null,
                c.getRoom() != null ? c.getRoom().getName() : null,
                c.getScheduleSlot() != null ? c.getScheduleSlot().getId() : null,
                c.getScheduleSlot() != null ? c.getScheduleSlot().getSlotCode() : null,
                c.getMainTeacher() != null ? c.getMainTeacher().getId() : null,
                c.getMainTeacher() != null ? c.getMainTeacher().getFullName() : null,
                c.getAssistantTeacher() != null ? c.getAssistantTeacher().getId() : null,
                c.getAssistantTeacher() != null ? c.getAssistantTeacher().getFullName() : null,
                c.getStartDate(),
                c.getEndDate(),
                c.getMaxStudents(),
                enrolledCount,
                c.getTuitionFee(),
                c.getStatus() != null ? c.getStatus().name() : null,
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
