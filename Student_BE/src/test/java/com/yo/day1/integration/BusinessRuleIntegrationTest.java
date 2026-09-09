package com.yo.day1.integration;

import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.domain.entity.*;
import com.yo.day1.domain.enums.ClassStatus;
import com.yo.day1.domain.enums.EnrollmentStatus;
import com.yo.day1.domain.enums.TeacherRole;
import com.yo.day1.dto.courseclass.CourseClassCreateRequest;
import com.yo.day1.dto.courseclass.CourseClassResponse;
import com.yo.day1.dto.enrollment.EnrollmentCreateRequest;
import com.yo.day1.dto.enrollment.TransferRequest;
import com.yo.day1.repository.*;
import com.yo.day1.service.CourseClassService;
import com.yo.day1.service.EnrollmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class BusinessRuleIntegrationTest {

    @Autowired private EnrollmentService enrollmentService;
    @Autowired private CourseClassService courseClassService;
    @Autowired private StudentRepository studentRepository;
    @Autowired private ParentRepository parentRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private ScheduleSlotRepository scheduleSlotRepository;
    @Autowired private TeacherRepository teacherRepository;
    @Autowired private CourseClassRepository courseClassRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    private Student studentA;
    private Student studentB;
    private Parent parentA;
    private Parent parentB;
    private Course course;
    private Room roomA;
    private Teacher teacherA;
    private ScheduleSlot slot1; // T2 17:00-18:30
    private ScheduleSlot slot2; // T2 18:00-19:30 (overlaps slot1)
    private ScheduleSlot slot3; // T2 18:30-20:00 (no overlap with slot1)
    private ScheduleSlot slot4; // T3 17:30-19:00

    @BeforeEach
    void setup() {
        parentA = new Parent(); parentA.setFullName("Parent A"); parentA.setEmail("pa@test.com");
        parentRepository.save(parentA);

        parentB = new Parent(); parentB.setFullName("Parent B"); parentB.setEmail("pb@test.com");
        parentRepository.save(parentB);

        studentA = new Student(); studentA.setStudentCode("SA"); studentA.setFullName("Student A"); studentA.setParent(parentA);
        studentRepository.save(studentA);

        studentB = new Student(); studentB.setStudentCode("SB"); studentB.setFullName("Student B"); studentB.setParent(parentA);
        studentRepository.save(studentB);

        course = new Course(); course.setCourseCode("C1"); course.setCourseName("Course 1");
        courseRepository.save(course);

        roomA = new Room(); roomA.setName("Room A"); roomA.setCapacity(25);
        roomRepository.save(roomA);

        teacherA = createTeacher("TA", "Teacher A", "0123456789");

        slot1 = new ScheduleSlot(); slot1.setWeekday((byte) 2); slot1.setStartTime(LocalTime.of(17, 0)); slot1.setEndTime(LocalTime.of(18, 30));
        scheduleSlotRepository.save(slot1);

        slot2 = new ScheduleSlot(); slot2.setWeekday((byte) 2); slot2.setStartTime(LocalTime.of(18, 0)); slot2.setEndTime(LocalTime.of(19, 30));
        scheduleSlotRepository.save(slot2);

        slot3 = new ScheduleSlot(); slot3.setWeekday((byte) 2); slot3.setStartTime(LocalTime.of(18, 30)); slot3.setEndTime(LocalTime.of(20, 0));
        scheduleSlotRepository.save(slot3);

        slot4 = new ScheduleSlot(); slot4.setWeekday((byte) 3); slot4.setStartTime(LocalTime.of(17, 30)); slot4.setEndTime(LocalTime.of(19, 0));
        scheduleSlotRepository.save(slot4);
    }

    private Teacher createTeacher(String code, String name, String phone) {
        Teacher t = new Teacher();
        t.setTeacherCode(code);
        t.setFullName(name);
        t.setPhone(phone);
        t.setIsActive(true);
        t.setDeleted(false);
        t.setTeacherRole(TeacherRole.TEACHER);
        return teacherRepository.save(t);
    }

    private CourseClass createClass(String code, ScheduleSlot slot, Room room, Teacher teacher, int capacity) {
        CourseClass c = new CourseClass();
        c.setClassCode(code);
        c.setName(code);
        c.setCourse(course);
        c.setRoom(room);
        c.setScheduleSlot(slot);
        c.setMainTeacher(teacher);
        c.setMaxStudents(capacity);
        c.setStartDate(LocalDate.now());
        c.setTuitionFee(BigDecimal.ZERO);
        c.setStatus(ClassStatus.OPEN);
        return courseClassRepository.save(c);
    }

    private EnrollmentCreateRequest createEnrollmentReq(Long studentId, Long classId) {
        EnrollmentCreateRequest req = new EnrollmentCreateRequest();
        req.setStudentId(studentId);
        req.setCourseClassId(classId);
        req.setEnrolledAt(LocalDate.now());
        req.setStatus(EnrollmentStatus.ACTIVE);
        req.setNote("");
        return req;
    }

    @Test
    void test1_ParentStudentRelationships() {
        // Parent A -> Student A (PASS)
        assertEquals(parentA.getId(), studentA.getParent().getId());
        // Parent A -> Student B (PASS)
        assertEquals(parentA.getId(), studentB.getParent().getId());

        // Student A -> Parent B (1:1 at Student side)
        studentA.setParent(parentB);
        studentRepository.save(studentA);
        assertEquals(parentB.getId(), studentA.getParent().getId());
        assertNotEquals(parentA.getId(), studentA.getParent().getId());
    }

    @Test
    void test2_StudentMultipleClassesNoConflict() {
        CourseClass class1 = createClass("JAVA01", slot1, roomA, teacherA, 20);

        Room roomB = new Room(); roomB.setName("Room B"); roomB.setCapacity(25); roomRepository.save(roomB);
        Teacher teacherB = createTeacher("TB", "Teacher B", "0987654321");
        CourseClass class2 = createClass("TOAN01", slot4, roomB, teacherB, 20); // Different weekday

        enrollmentService.create(createEnrollmentReq(studentA.getId(), class1.getId()));
        enrollmentService.create(createEnrollmentReq(studentA.getId(), class2.getId()));

        assertEquals(2, enrollmentRepository.findByStudentId(studentA.getId()).size());
    }

    @Test
    void test3_StudentSameTimeConflict() {
        CourseClass class1 = createClass("JAVA01", slot1, roomA, teacherA, 20);

        Room roomB = new Room(); roomB.setName("Room B"); roomB.setCapacity(25); roomRepository.save(roomB);
        Teacher teacherB = createTeacher("TB", "Teacher B", "0987654321");
        CourseClass class2 = createClass("TOAN01", slot1, roomB, teacherB, 20); // Same slot

        enrollmentService.create(createEnrollmentReq(studentA.getId(), class1.getId()));

        assertThrows(ConflictException.class, () -> {
            enrollmentService.create(createEnrollmentReq(studentA.getId(), class2.getId()));
        });
    }

    @Test
    void test4_StudentPartialOverlapConflict() {
        CourseClass class1 = createClass("Class A", slot1, roomA, teacherA, 20);

        Room roomB = new Room(); roomB.setName("Room B"); roomB.setCapacity(25); roomRepository.save(roomB);
        Teacher teacherB = createTeacher("TB", "Teacher B", "0987654321");
        CourseClass class2 = createClass("Class B", slot2, roomB, teacherB, 20); // Overlaps slot1

        enrollmentService.create(createEnrollmentReq(studentA.getId(), class1.getId()));

        assertThrows(ConflictException.class, () -> {
            enrollmentService.create(createEnrollmentReq(studentA.getId(), class2.getId()));
        });
    }

    @Test
    void test5_StudentAdjacentSlotsNoConflict() {
        CourseClass class1 = createClass("Class A", slot1, roomA, teacherA, 20);

        Room roomB = new Room(); roomB.setName("Room B"); roomB.setCapacity(25); roomRepository.save(roomB);
        Teacher teacherB = createTeacher("TB", "Teacher B", "0987654321");
        CourseClass class2 = createClass("Class B", slot3, roomB, teacherB, 20); // Adjacent to slot1

        enrollmentService.create(createEnrollmentReq(studentA.getId(), class1.getId()));
        enrollmentService.create(createEnrollmentReq(studentA.getId(), class2.getId()));

        assertEquals(2, enrollmentRepository.findByStudentId(studentA.getId()).size());
    }

    @Test
    void test6_RoomConflict() {
        createClass("Class A", slot1, roomA, teacherA, 20);

        Teacher teacherB = createTeacher("TB", "Teacher B", "0987654321");

        assertThrows(ConflictException.class, () -> {
            courseClassService.create(new CourseClassCreateRequest(
                "Class B", "Class B", course.getId(), roomA.getId(), slot2.getId(), teacherB.getId(), null,
                LocalDate.now(), null, 20, BigDecimal.ZERO, ClassStatus.OPEN
            )); // slot2 overlaps slot1 on roomA
        });
    }

    @Test
    void test7_TeacherConflict() {
        createClass("Class A", slot1, roomA, teacherA, 20);

        Room roomB = new Room(); roomB.setName("Room B"); roomB.setCapacity(25); roomRepository.save(roomB);

        assertThrows(ConflictException.class, () -> {
            courseClassService.create(new CourseClassCreateRequest(
                "Class B", "Class B", course.getId(), roomB.getId(), slot2.getId(), teacherA.getId(), null,
                LocalDate.now(), null, 20, BigDecimal.ZERO, ClassStatus.OPEN
            )); // slot2 overlaps slot1 for teacherA
        });
    }

    @Test
    void test8_CapacityLimit() {
        CourseClass class1 = createClass("Class A", slot1, roomA, teacherA, 1);

        enrollmentService.create(createEnrollmentReq(studentA.getId(), class1.getId()));

        assertThrows(ConflictException.class, () -> {
            enrollmentService.create(createEnrollmentReq(studentB.getId(), class1.getId()));
        });
    }

    @Test
    void test9_DuplicateEnrollment() {
        CourseClass class1 = createClass("JAVA01", slot1, roomA, teacherA, 20);

        enrollmentService.create(createEnrollmentReq(studentA.getId(), class1.getId()));

        assertThrows(ConflictException.class, () -> {
            enrollmentService.create(createEnrollmentReq(studentA.getId(), class1.getId()));
        });
    }

    @Test
    void test10_TransferStudent() {
        CourseClass class1 = createClass("JAVA01", slot1, roomA, teacherA, 20);

        Room roomB = new Room(); roomB.setName("Room B"); roomB.setCapacity(25); roomRepository.save(roomB);
        Teacher teacherB = createTeacher("TB", "Teacher B", "0987654321");
        CourseClass class2 = createClass("TOAN01", slot2, roomB, teacherB, 20);

        enrollmentService.create(createEnrollmentReq(studentA.getId(), class1.getId()));

        enrollmentService.transfer(new TransferRequest(studentA.getId(), class1.getId(), class2.getId(), "Change level", LocalDate.now()));

        assertEquals(EnrollmentStatus.DROPPED, enrollmentRepository.findByStudentIdAndCourseClassId(studentA.getId(), class1.getId()).get().getStatus());
        assertEquals(EnrollmentStatus.ACTIVE, enrollmentRepository.findByStudentIdAndCourseClassId(studentA.getId(), class2.getId()).get().getStatus());
    }

    @Test
    void test11_MainTeacherEqualsAssistantTeacher() {
        Room roomB = new Room(); roomB.setName("Room B"); roomB.setCapacity(25); roomRepository.save(roomB);

        assertThrows(ConflictException.class, () -> {
            courseClassService.create(new CourseClassCreateRequest(
                "Class SameTeacher", "Class SameTeacher", course.getId(), roomB.getId(), slot4.getId(),
                teacherA.getId(), teacherA.getId(), // Same teacher for main and assistant!
                LocalDate.now(), null, 20, BigDecimal.ZERO, ClassStatus.OPEN
            ));
        });
    }

    @Test
    void test12_RoomCapacityExceeded() {
        // roomA has capacity = 25. Attempting to create class with maxStudents = 30 must be rejected!
        assertThrows(ConflictException.class, () -> {
            courseClassService.create(new CourseClassCreateRequest(
                "Class OverCapacity", "Class OverCapacity", course.getId(), roomA.getId(), slot4.getId(),
                teacherA.getId(), null,
                LocalDate.now(), null, 30, BigDecimal.ZERO, ClassStatus.OPEN
            ));
        });
    }

    @Test
    void test13_ReEnrollmentDroppedStudent() {
        CourseClass class1 = createClass("RE-ENROLL-01", slot1, roomA, teacherA, 20);

        // 1. Enroll
        var enr = enrollmentService.create(createEnrollmentReq(studentA.getId(), class1.getId()));
        assertEquals(EnrollmentStatus.ACTIVE.toString(), enr.getStatus());

        // 2. Drop
        enrollmentService.drop(enr.getId());
        assertEquals(EnrollmentStatus.DROPPED, enrollmentRepository.findById(enr.getId()).get().getStatus());

        // 3. Re-enroll in same class: must succeed by updating existing record without duplicate key error
        var reEnrolled = enrollmentService.create(createEnrollmentReq(studentA.getId(), class1.getId()));
        assertEquals(EnrollmentStatus.ACTIVE.toString(), reEnrolled.getStatus());
        assertEquals(enr.getId(), reEnrolled.getId()); // Same row reactivated
    }

    @Test
    void test14_InactiveTeacherCannotBeAssignedNewClass() {
        Teacher retiredTeacher = new Teacher();
        retiredTeacher.setFullName("Retired Teacher");
        retiredTeacher.setTeacherCode("T-RETIRED");
        retiredTeacher.setPhone("0999888777");
        retiredTeacher.setIsActive(false);
        retiredTeacher.setDeleted(true);
        retiredTeacher.setTeacherRole(TeacherRole.TEACHER);
        teacherRepository.save(retiredTeacher);

        Room roomB = new Room(); roomB.setName("Room B"); roomB.setCapacity(25); roomRepository.save(roomB);

        assertThrows(ConflictException.class, () -> {
            courseClassService.create(new CourseClassCreateRequest(
                "Class RetiredTeacher", "Class RetiredTeacher", course.getId(), roomB.getId(), slot4.getId(),
                retiredTeacher.getId(), null,
                LocalDate.now(), null, 20, BigDecimal.ZERO, ClassStatus.OPEN
            ));
        });
    }

    @Test
    void test15_HistoricalClassWithDeletedTeacherStillReadable() {
        Teacher pastTeacher = new Teacher();
        pastTeacher.setFullName("Past Teacher");
        pastTeacher.setTeacherCode("T-PAST");
        pastTeacher.setPhone("0988776655");
        pastTeacher.setIsActive(false);
        pastTeacher.setDeleted(true); // Teacher is archived/deleted
        pastTeacher.setTeacherRole(TeacherRole.TEACHER);
        teacherRepository.save(pastTeacher);

        CourseClass historicalClass = createClass("HISTORICAL-01", slot1, roomA, pastTeacher, 20);
        historicalClass.setStatus(ClassStatus.CLOSED);
        courseClassRepository.save(historicalClass);

        // Fetching historical class MUST succeed and preserve teacher information without 500 error!
        CourseClassResponse res = courseClassService.findById(historicalClass.getId());
        assertNotNull(res);
        assertEquals(pastTeacher.getId(), res.mainTeacherId());
        assertEquals("Past Teacher", res.mainTeacherName());
    }

    @Test
    void test16_OngoingClassBlocksRoomAndTeacherConflict() {
        // Create an ONGOING class (not just OPEN)
        CourseClass ongoingClass = createClass("ONGOING-01", slot1, roomA, teacherA, 20);
        ongoingClass.setStatus(ClassStatus.ONGOING);
        courseClassRepository.save(ongoingClass);

        Teacher teacherB = createTeacher("TB", "Teacher B", "0987654321");

        // Room conflict check against ONGOING class must trigger ConflictException!
        assertThrows(ConflictException.class, () -> {
            courseClassService.create(new CourseClassCreateRequest(
                "Class OverlapRoom", "Class OverlapRoom", course.getId(), roomA.getId(), slot2.getId(),
                teacherB.getId(), null,
                LocalDate.now(), null, 20, BigDecimal.ZERO, ClassStatus.OPEN
            ));
        });

        // Teacher conflict check against ONGOING class must trigger ConflictException!
        Room roomB = new Room(); roomB.setName("Room B"); roomB.setCapacity(25); roomRepository.save(roomB);
        assertThrows(ConflictException.class, () -> {
            courseClassService.create(new CourseClassCreateRequest(
                "Class OverlapTeacher", "Class OverlapTeacher", course.getId(), roomB.getId(), slot2.getId(),
                teacherA.getId(), null,
                LocalDate.now(), null, 20, BigDecimal.ZERO, ClassStatus.OPEN
            ));
        });
    }
}
