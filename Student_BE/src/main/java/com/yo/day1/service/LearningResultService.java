package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.dto.learning.LearningResultCreateRequest;
import com.yo.day1.dto.learning.LearningResultResponse;
import com.yo.day1.dto.learning.LearningResultUpdateRequest;
import com.yo.day1.dto.learning.LearningResultSearchRequest;

import java.util.List;

public interface LearningResultService {
    LearningResultResponse create(LearningResultCreateRequest request, String username);
    LearningResultResponse update(Long id, LearningResultUpdateRequest request, String username);
    List<LearningResultResponse> findByStudentId(Long studentId, String username) throws BadRequestException, NotFoundExeception;
    List<LearningResultResponse> findByClassAndMonth(Long courseClassId, int year, int month);
    List<LearningResultResponse> search(LearningResultSearchRequest request, String username);
    void delete(Long id, String username);
    void lock(Long id, String username);
    void unlock(Long id, String username);
}
