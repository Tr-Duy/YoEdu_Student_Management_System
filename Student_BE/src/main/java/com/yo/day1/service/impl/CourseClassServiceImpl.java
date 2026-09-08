package com.yo.day1.service.impl;

import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.enums.ClassStatus;
import com.yo.day1.domain.spec.CourseClassSpec;
import com.yo.day1.dto.courseclass.CourseClassCreateRequest;
import com.yo.day1.dto.courseclass.CourseClassResponse;
import com.yo.day1.repository.*;
import com.yo.day1.service.CourseClassService;
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
        return toResponse(courseClassRepository.save(courseClass));
    }

    @Transactional
    @Override
    public CourseClassResponse update(Long id, CourseClassCreateRequest request) {
        CourseClass courseClass = getCourseClass(id);
        apply(courseClass, request);
        return toResponse(courseClassRepository.save(courseClass));
    }

    @Transactional
    @Override
    public void delete(Long id) {
        courseClassRepository.delete(getCourseClass(id));
    }

    @Transactional(readOnly = true)
    @Override
    public CourseClass getCourseClass(Long id) {
        return courseClassRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Course class not found: " + id));
    }

    private void apply(CourseClass c, CourseClassCreateRequest r) {
        c.setClassCode(r.classCode());
        c.setName(r.name());
        c.setCourse(courseRepository.findById(r.courseId())
                .orElseThrow(() -> new NotFoundExeception("Course not found: " + r.courseId())));
        c.setRoom(roomRepository.findById(r.roomId())
                .orElseThrow(() -> new NotFoundExeception("Room not found: " + r.roomId())));
        c.setScheduleSlot(scheduleSlotRepository.findById(r.scheduleSlotId())
                .orElseThrow(() -> new NotFoundExeception("Schedule slot not found: " + r.scheduleSlotId())));
        c.setMainTeacher(teacherRepository.findById(r.mainTeacherId())
                .orElseThrow(() -> new NotFoundExeception("Teacher not found: " + r.mainTeacherId())));
        if (r.assistantTeacherId() != null) {
            c.setAssistantTeacher(teacherRepository.findById(r.assistantTeacherId())
                    .orElseThrow(() -> new NotFoundExeception("Teacher not found: " + r.assistantTeacherId())));
        } else {
            c.setAssistantTeacher(null);
        }
        c.setStartDate(r.startDate());
        c.setEndDate(r.endDate());
        c.setMaxStudents(r.maxStudents());
        c.setTuitionFee(r.tuitionFee());
        c.setStatus(r.status());
    }

    private CourseClassResponse toResponse(CourseClass c) {
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
                c.getTuitionFee(),
                c.getStatus() != null ? c.getStatus().name() : null,
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
