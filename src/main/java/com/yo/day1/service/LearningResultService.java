package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.dto.learning.LearningResultCreateRequest;
import com.yo.day1.dto.learning.LearningResultResponse;

import java.util.List;

public interface LearningResultService {
    LearningResultResponse create(LearningResultCreateRequest request, String username);
    List<LearningResultResponse> findByStudentId(Long studentId, String username) throws BadRequestException, NotFoundExeception;
}
