package com.yo.day1.dto.parent;

import com.yo.day1.dto.parent.StudentCard;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParentDashboardResponse {
    private Long parentId;
    private String parentName;
    private String username;
    private List<StudentCard> students;
    private List<InvoiceCard> invoices;
    private List<NotificationCard> notifications;
}