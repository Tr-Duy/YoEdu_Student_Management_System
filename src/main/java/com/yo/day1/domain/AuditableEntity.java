package com.yo.day1.domain;
// dung de tự động tracking thời gian cho các entity trong database.
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@MappedSuperclass // Báo cho JPA biết đây là class cha, không tạo table riêng
@Setter
@Getter
public class AuditableEntity extends BaseEnity {

    @CreationTimestamp //Hibernate tự động set giá trị created_at = thời điểm INSERT record
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp   // Hibernate tự động cập nhật updated_at = thời điểm UPDATE record

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
