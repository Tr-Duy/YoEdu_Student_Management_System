package com.yo.day1.domain.entity;

import com.yo.day1.domain.AuditableEntity;
import com.yo.day1.domain.enums.TeacherRole;
import com.yo.day1.domain.enums.TeacherStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "teachers")
@SQLDelete(sql = "UPDATE teachers SET deleted = true WHERE id = ?")
@SQLRestriction("deleted = false")
public class Teacher extends AuditableEntity {

    @Column(name = "teacher_code", nullable = false, unique = true, length = 20)
    private String teacherCode;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "teacher_role", nullable = false, length = 20)
    private TeacherRole teacherRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TeacherStatus status = TeacherStatus.ACTIVE;

    @Column(name = "cccd_image_url", length = 255)
    private String cccdImageUrl;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(precision = 12, scale = 2)
    private BigDecimal salary;

    @Column(name = "weekly_slots")
    private Integer weeklySlots;

    @Column(length = 255)
    private String address;

    @Column(length = 255)
    private String description;

    @Column(name = "work_unit", length = 100)
    private String workUnit;

    @Column(length = 500)
    private String experience;

    @Column(length = 500)
    private String achievement;
}
