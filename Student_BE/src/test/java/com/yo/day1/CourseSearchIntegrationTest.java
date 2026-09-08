package com.yo.day1;

import com.yo.day1.domain.entity.Course;
import com.yo.day1.dto.course.CourseResponse;
import com.yo.day1.repository.CourseRepository;
import com.yo.day1.service.CourseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
public class CourseSearchIntegrationTest {

    @Autowired
    private CourseService courseService;

    @Autowired
    private CourseRepository courseRepository;

    @BeforeEach
    void setUp() {
        // Ensure test courses exist in DB
        if (courseRepository.findAll().stream().noneMatch(c -> "JAVA01".equalsIgnoreCase(c.getCourseCode()))) {
            Course javaCourse = new Course();
            javaCourse.setCourseCode("JAVA01");
            javaCourse.setCourseName("Java Core Updated");
            javaCourse.setCourseDescription("Khoá học Java Core từ cơ bản đến nâng cao");
            javaCourse.setTuitionFee(2500000);
            javaCourse.setTotalSession(36);
            javaCourse.setIsActive((byte) 1);
            courseRepository.save(javaCourse);
        }
        if (courseRepository.findAll().stream().noneMatch(c -> "C002".equalsIgnoreCase(c.getCourseCode()))) {
            Course c002 = new Course();
            c002.setCourseCode("C002");
            c002.setCourseName("Lập trình Scratch cơ bản");
            c002.setCourseDescription("Làm quen tư duy lập trình");
            c002.setTuitionFee(1500000);
            c002.setTotalSession(20);
            c002.setIsActive((byte) 1);
            courseRepository.save(c002);
        }
        if (courseRepository.findAll().stream().noneMatch(c -> "C003".equalsIgnoreCase(c.getCourseCode()))) {
            Course c003 = new Course();
            c003.setCourseCode("C003");
            c003.setCourseName("Toán tư duy lớp 6");
            c003.setCourseDescription("Phát triển tư duy logic");
            c003.setTuitionFee(1300000);
            c003.setTotalSession(24);
            c003.setIsActive((byte) 1);
            courseRepository.save(c003);
        }
    }

    @Test
    void test1_SearchJAVA01_ReturnsOnlyJAVA01() {
        List<CourseResponse> results = courseService.findAll("JAVA01");
        assertThat(results).isNotEmpty();
        assertThat(results).allMatch(c -> c.getCourseCode().equalsIgnoreCase("JAVA01"));
        assertThat(results.stream().noneMatch(c -> "C002".equals(c.getCourseCode()) || "C003".equals(c.getCourseCode()))).isTrue();
    }

    @Test
    void test2_SearchJavaCoreUpdated_ReturnsOnlyJAVA01() {
        List<CourseResponse> results = courseService.findAll("Java Core Updated");
        assertThat(results).isNotEmpty();
        assertThat(results).allMatch(c -> c.getCourseCode().equalsIgnoreCase("JAVA01"));
    }

    @Test
    void test3_SearchC002_ReturnsOnlyC002() {
        List<CourseResponse> results = courseService.findAll("C002");
        assertThat(results).isNotEmpty();
        assertThat(results).allMatch(c -> c.getCourseCode().equalsIgnoreCase("C002"));
    }

    @Test
    void test4_SearchScratch_ReturnsOnlyC002() {
        List<CourseResponse> results = courseService.findAll("Scratch");
        assertThat(results).isNotEmpty();
        assertThat(results).allMatch(c -> c.getCourseCode().equalsIgnoreCase("C002"));
    }

    @Test
    void test5_SearchC003_ReturnsOnlyC003() {
        List<CourseResponse> results = courseService.findAll("C003");
        assertThat(results).isNotEmpty();
        assertThat(results).allMatch(c -> c.getCourseCode().equalsIgnoreCase("C003"));
    }

    @Test
    void test6_SearchNonExistent_ReturnsEmpty() {
        List<CourseResponse> results = courseService.findAll("abcxyz999");
        assertThat(results).isEmpty();
    }

    @Test
    void test7_SearchEmptyOrNull_ReturnsAllCourses() {
        List<CourseResponse> resultsEmpty = courseService.findAll("");
        List<CourseResponse> resultsNull = courseService.findAll(null);
        List<CourseResponse> resultsAll = courseService.findAll();

        assertThat(resultsEmpty).hasSizeGreaterThanOrEqualTo(3);
        assertThat(resultsNull).hasSameSizeAs(resultsEmpty);
        assertThat(resultsAll).hasSameSizeAs(resultsEmpty);
    }

    @Test
    void test8_SearchCaseInsensitive_MatchesJAVA01() {
        List<CourseResponse> lower = courseService.findAll("java01");
        List<CourseResponse> upper = courseService.findAll("JAVA01");
        List<CourseResponse> mixed = courseService.findAll("jAvA01");

        assertThat(lower).isNotEmpty();
        assertThat(lower).hasSameSizeAs(upper);
        assertThat(lower).hasSameSizeAs(mixed);
        assertThat(lower.get(0).getCourseCode()).isEqualTo("JAVA01");
    }
}
