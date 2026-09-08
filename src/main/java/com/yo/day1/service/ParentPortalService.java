package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.dto.parent.ParentDashboardResponse;

public interface ParentPortalService {
    ParentDashboardResponse getDashboard(String username) throws BadRequestException;
}
