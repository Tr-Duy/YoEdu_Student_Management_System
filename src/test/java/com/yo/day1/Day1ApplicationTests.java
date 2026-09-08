package com.yo.day1;

import com.yo.day1.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class Day1ApplicationTests {

    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private ParentRepository parentRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TeacherRepository teacherRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private CourseClassRepository courseClassRepository;
    @Autowired
    private RoomRepository roomRepository;
    @Autowired
    private ScheduleSlotRepository scheduleSlotRepository;
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    @Autowired
    private PromotionRepository promotionRepository;

    @Test
    void testDatabaseCounts() {
        System.out.println("========== DATABASE CONTEXT DIAGNOSTIC ==========");
        System.out.println("Students Count: " + studentRepository.count());
        System.out.println("Parents Count: " + parentRepository.count());
        System.out.println("Users Count: " + userRepository.count());
        System.out.println("Teachers Count: " + teacherRepository.count());
        System.out.println("Courses Count: " + courseRepository.count());
        System.out.println("Course Classes Count: " + courseClassRepository.count());
        System.out.println("Rooms Count: " + roomRepository.count());
        System.out.println("Schedule Slots Count: " + scheduleSlotRepository.count());
        System.out.println("Enrollments Count: " + enrollmentRepository.count());
        System.out.println("Promotions Count: " + promotionRepository.count());
        System.out.println("==================================================");
        
        System.out.println("========== LISTING COURSES ==========");
        courseRepository.findAll().forEach(c -> System.out.println("Course: " + c.getId() + " - " + c.getCourseCode() + " - " + c.getCourseName()));
        
        System.out.println("========== LISTING TEACHERS ==========");
        teacherRepository.findAll().forEach(t -> System.out.println("Teacher: " + t.getId() + " - " + t.getTeacherCode() + " - " + t.getFullName()));
        
        System.out.println("========== LISTING ROOMS ==========");
        roomRepository.findAll().forEach(r -> System.out.println("Room: " + r.getId() + " - " + r.getRoomCode() + " - " + r.getName()));

        System.out.println("========== LISTING SCHEDULE SLOTS ==========");
        scheduleSlotRepository.findAll().forEach(s -> System.out.println("Slot: " + s.getId() + " - " + s.getSlotCode()));
        
        System.out.println("========== LISTING CLASSES ==========");
        courseClassRepository.findAll().forEach(cc -> System.out.println("Class: " + cc.getId() + " - " + cc.getClassCode()));
        System.out.println("=====================================");
    }

}


