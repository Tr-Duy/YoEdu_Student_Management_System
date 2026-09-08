package com.yo.day1.domain.entity;

import com.yo.day1.domain.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "courses")
public class Course extends AuditableEntity {

    @Column(name = "course_code", columnDefinition = "varchar(20)")
    private String courseCode;

    @Column(name = "name", columnDefinition = "varchar(100)")
    private String courseName;

    @Column(name = "description", columnDefinition = "text")
    private String courseDescription;

    @Column(name = "tuition_fee")
    private double tuitionFee;

    @Column(name = "total_sessions")
    private int totalSession;

    @Column(name = "is_active")
    private byte isActive;
}
