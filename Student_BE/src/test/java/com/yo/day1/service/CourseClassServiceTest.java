package com.yo.day1.service;

import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.*;
import com.yo.day1.domain.enums.ClassStatus;
import com.yo.day1.dto.courseclass.CourseClassCreateRequest;
import com.yo.day1.dto.courseclass.CourseClassResponse;
import com.yo.day1.repository.*;
import com.yo.day1.service.impl.CourseClassServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CourseClassServiceTest {

    @Mock
    private CourseClassRepository courseClassRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private ScheduleSlotRepository scheduleSlotRepository;

    @Mock
    private TeacherRepository teacherRepository;

    @Mock
    private ScheduleConflictService scheduleConflictService;

    @InjectMocks
    private CourseClassServiceImpl service;

    // ==================== search ====================

    @Test
    @SuppressWarnings("unchecked")
    void searchReturnsPagedResult() {
        CourseClass courseClass = createEntity(1L);
        Page<CourseClass> page = new PageImpl<>(List.of(courseClass));

        when(courseClassRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        Page<CourseClassResponse> result = service.search("ClassA", ClassStatus.OPEN, 1L, 1L, Pageable.unpaged());

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).id()).isEqualTo(1L);
    }

    // ==================== findAll ====================

    @Test
    void findAllReturnsPagedResultWhenSearchIsBlank() {
        CourseClass courseClass = createEntity(1L);
        Page<CourseClass> page = new PageImpl<>(List.of(courseClass));

        when(courseClassRepository.findAll(any(Pageable.class))).thenReturn(page);

        Page<CourseClassResponse> result = service.findAll("", Pageable.unpaged());

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).id()).isEqualTo(1L);
    }

    @Test
    void findAllReturnsPagedResultWhenSearchIsNotBlank() {
        CourseClass courseClass = createEntity(1L);
        Page<CourseClass> page = new PageImpl<>(List.of(courseClass));

        when(courseClassRepository.findByNameContainingIgnoreCaseOrClassCodeContainingIgnoreCase(anyString(), anyString(), any(Pageable.class))).thenReturn(page);

        Page<CourseClassResponse> result = service.findAll("SearchTerm", Pageable.unpaged());

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).id()).isEqualTo(1L);
    }

    // ==================== findByCourseId ====================

    @Test
    void findByCourseIdReturnsList() {
        CourseClass courseClass = createEntity(1L);

        when(courseClassRepository.findByCourseId(1L)).thenReturn(List.of(courseClass));

        List<CourseClassResponse> result = service.findByCourseId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
    }

    // ==================== findByStudentId ====================

    @Test
    void findByStudentIdReturnsList() {
        CourseClass courseClass = createEntity(1L);

        when(courseClassRepository.findActiveClassesByStudentId(1L)).thenReturn(List.of(courseClass));

        List<CourseClassResponse> result = service.findByStudentId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
    }

    // ==================== findById ====================

    @Test
    void findByIdSuccess() {
        CourseClass courseClass = createEntity(1L);

        when(courseClassRepository.findById(1L)).thenReturn(Optional.of(courseClass));

        CourseClassResponse result = service.findById(1L);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void findByIdReturnsEmptyWhenNotFound() {
        when(courseClassRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(NotFoundExeception.class)
                .hasMessageContaining("Course class not found: 99");
    }

    // ==================== create ====================

    @Test
    void createSuccess() {
        CourseClassCreateRequest request = buildRequest();
        CourseClass courseClass = createEntity(1L);

        when(courseRepository.findById(1L)).thenReturn(Optional.of(new Course()));
        when(roomRepository.findById(1L)).thenReturn(Optional.of(new Room()));
        when(scheduleSlotRepository.findById(1L)).thenReturn(Optional.of(new ScheduleSlot()));
        when(teacherRepository.findById(1L)).thenReturn(Optional.of(new Teacher()));
        when(teacherRepository.findById(2L)).thenReturn(Optional.of(new Teacher()));
        
        when(courseClassRepository.save(any(CourseClass.class))).thenAnswer(inv -> {
            CourseClass c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });

        CourseClassResponse result = service.create(request);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
    }

    // ==================== update ====================

    @Test
    void updateSuccess() {
        CourseClassCreateRequest request = buildRequest();
        CourseClass existing = createEntity(1L);

        when(courseClassRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(new Course()));
        when(roomRepository.findById(1L)).thenReturn(Optional.of(new Room()));
        when(scheduleSlotRepository.findById(1L)).thenReturn(Optional.of(new ScheduleSlot()));
        when(teacherRepository.findById(1L)).thenReturn(Optional.of(new Teacher()));
        when(teacherRepository.findById(2L)).thenReturn(Optional.of(new Teacher()));
        
        when(courseClassRepository.save(any(CourseClass.class))).thenReturn(existing);

        CourseClassResponse result = service.update(1L, request);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void updateThrowsWhenCourseClassNotFound() {
        CourseClassCreateRequest request = buildRequest();

        when(courseClassRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(99L, request))
                .isInstanceOf(NotFoundExeception.class)
                .hasMessageContaining("Course class not found: 99");
    }

    // ==================== delete ====================

    @Test
    void deleteSuccess() {
        CourseClass courseClass = createEntity(1L);
        when(courseClassRepository.findById(1L)).thenReturn(Optional.of(courseClass));

        service.delete(1L);

        verify(courseClassRepository).delete(courseClass);
    }

    @Test
    void deleteThrowsWhenNotFound() {
        when(courseClassRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(99L))
                .isInstanceOf(NotFoundExeception.class)
                .hasMessageContaining("Course class not found: 99");
        
        verify(courseClassRepository, never()).deleteById(any());
    }

    // ==================== helpers ====================

    private CourseClassCreateRequest buildRequest() {
        return new CourseClassCreateRequest(
                "Code",
                "Name",
                1L,
                1L,
                1L,
                1L,
                2L,
                LocalDate.now(),
                LocalDate.now().plusDays(10),
                30,
                BigDecimal.valueOf(100),
                ClassStatus.OPEN
        );
    }

    private CourseClass createEntity(long id) {
        CourseClass entity = new CourseClass();
        entity.setId(id);
        
        Course c = new Course();
        c.setId(1L);
        entity.setCourse(c);
        
        Room r = new Room();
        r.setId(1L);
        entity.setRoom(r);
        
        ScheduleSlot s = new ScheduleSlot();
        s.setId(1L);
        entity.setScheduleSlot(s);
        
        Teacher t1 = new Teacher();
        t1.setId(1L);
        entity.setMainTeacher(t1);
        
        Teacher t2 = new Teacher();
        t2.setId(2L);
        entity.setAssistantTeacher(t2);
        
        entity.setStatus(ClassStatus.OPEN);
        
        return entity;
    }
}
