package com.yo.day1;

import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.entity.Teacher;
import com.yo.day1.repository.CourseClassRepository;
import com.yo.day1.repository.TeacherRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

@SpringBootTest
public class DatabaseDiagnosticTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void runDiagnostic() {
        System.out.println("========== 1. RAW SQL: TEACHERS TABLE ==========");
        List<Map<String, Object>> teachers = jdbcTemplate.queryForList("SELECT id, teacher_code, full_name, phone, is_active, deleted FROM teachers");
        for (Map<String, Object> t : teachers) {
            System.out.println("Teacher DB Row: " + t);
        }

        System.out.println("========== 2. RAW SQL: COURSE_CLASSES TABLE ==========");
        List<Map<String, Object>> classes = jdbcTemplate.queryForList("SELECT id, class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, status FROM course_classes");
        for (Map<String, Object> c : classes) {
            System.out.println("CourseClass DB Row: " + c);
        }

        System.out.println("========== 3. RAW SQL: COURSE_CLASSES JOIN TEACHERS (MAIN TEACHER) ==========");
        List<Map<String, Object>> joinMain = jdbcTemplate.queryForList("""
            SELECT cc.id AS class_id, cc.class_code, cc.name AS class_name, cc.main_teacher_id, 
                   t.id AS teacher_id, t.full_name AS teacher_name, t.deleted AS teacher_deleted
            FROM course_classes cc
            LEFT JOIN teachers t ON t.id = cc.main_teacher_id
            """);
        for (Map<String, Object> j : joinMain) {
            System.out.println("Class Main Teacher Join: " + j);
        }

        System.out.println("========== 4. RAW SQL: COURSE_CLASSES JOIN TEACHERS (ASSISTANT TEACHER) ==========");
        List<Map<String, Object>> joinAssistant = jdbcTemplate.queryForList("""
            SELECT cc.id AS class_id, cc.class_code, cc.name AS class_name, cc.assistant_teacher_id, 
                   t.id AS teacher_id, t.full_name AS teacher_name, t.deleted AS teacher_deleted
            FROM course_classes cc
            LEFT JOIN teachers t ON t.id = cc.assistant_teacher_id
            WHERE cc.assistant_teacher_id IS NOT NULL
            """);
        for (Map<String, Object> j : joinAssistant) {
            System.out.println("Class Assistant Teacher Join: " + j);
        }
    }

    @Autowired
    private com.yo.day1.service.CourseClassService courseClassService;

    @Test
    void testServiceSearch() {
        System.out.println("========== 5. COURSE_CLASS_SERVICE SEARCH ==========");
        org.springframework.data.domain.Page<com.yo.day1.dto.courseclass.CourseClassResponse> page = 
            courseClassService.search(null, null, null, null, org.springframework.data.domain.PageRequest.of(0, 10));
        System.out.println("Total elements: " + page.getTotalElements());
        for (com.yo.day1.dto.courseclass.CourseClassResponse res : page.getContent()) {
            System.out.println("Mapped DTO Response: id=" + res.id() + ", code=" + res.classCode() + ", name=" + res.name() + ", mainTeacher=" + res.mainTeacherName() + ", course=" + res.courseName());
        }
    }
}
