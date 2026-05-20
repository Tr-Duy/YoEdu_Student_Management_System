package com.yo.day1.domain.entity;

import com.yo.day1.domain.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "room")
public class Room extends AuditableEntity {

    @Column(length = 20)
    private String roomCode;

    @Column(columnDefinition = "varchar(100)")
    private String name;

    private int capacity;

    private String description;
}
