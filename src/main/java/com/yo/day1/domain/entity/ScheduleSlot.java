package com.yo.day1.domain.entity;

import com.yo.day1.domain.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalTime;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "schedule_slots")
public class ScheduleSlot extends AuditableEntity {

    @Column(columnDefinition = "varchar(20)")
    private String slotCode;

    private byte weekday;

    private LocalTime startTime;
    private LocalTime endTime;

    @Column(columnDefinition = "varchar(255)")
    private String note;
}
