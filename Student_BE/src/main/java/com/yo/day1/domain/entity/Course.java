package com.yo.day1.domain.entity;

import com.yo.day1.domain.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "courses")
public class Course extends AuditableEntity {

    @Column(name = "course_code", nullable = false, unique = true, length = 20)
    private String courseCode;

    @Column(name = "name", nullable = false, length = 100)
    private String courseName;

    @Column(name = "description", columnDefinition = "varchar(500)")
    private String courseDescription;

    @Column(name = "tuition_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal tuitionFee = BigDecimal.ZERO;

    @Column(name = "total_sessions", nullable = false)
    private int totalSession = 24;

    @Column(name = "is_active", nullable = false)
    private byte isActive = 1;
}
