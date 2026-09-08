package com.yo.day1.dto.student;

import com.yo.day1.domain.enums.StudentStatus;

import java.time.LocalDateTime;

public record StudentStatusHistoryResponse(
        Long id,
        StudentStatus oldStatus,
        StudentStatus newStatus,
        String reason,
        Long changedByUserId,
        LocalDateTime changedAt
) {}
