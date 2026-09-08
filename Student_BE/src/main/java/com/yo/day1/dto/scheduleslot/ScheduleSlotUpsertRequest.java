package com.yo.day1.dto.scheduleslot;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalTime;

@Data
public class ScheduleSlotUpsertRequest {
    @NotBlank
    private String slotCode;

    @NotNull
    private Byte weekday;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    private String note;
}
