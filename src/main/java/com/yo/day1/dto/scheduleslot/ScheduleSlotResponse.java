package com.yo.day1.dto.scheduleslot;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
public class ScheduleSlotResponse {
    private Long id;
    private String slotCode;
    private Byte weekday;
    private LocalTime startTime;
    private LocalTime endTime;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
