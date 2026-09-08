package com.yo.day1.dto.parent;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationCard {
    public Long id;
    public String type;
    public String title;
    public String content;
    public Boolean isRead;
    public LocalDateTime createdAt;
}