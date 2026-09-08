package com.yo.day1.dto.room;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

@Data
public class RoonUpsertRequest {

    @Length(min = 1, max = 100)
    @NotBlank // khong de trong
    private String roomCode;

    @Length(max = 100)
    private String name;

    @Min(1)
    private int capacity;

    private String description;
}
