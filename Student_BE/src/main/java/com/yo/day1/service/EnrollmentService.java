package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Enrollment;
import com.yo.day1.dto.enrollment.EnrollmentCreateRequest;
import com.yo.day1.dto.enrollment.EnrollmentResponse;
import com.yo.day1.dto.enrollment.TransferRequest;

import java.util.List;

public interface EnrollmentService {
    EnrollmentResponse create(EnrollmentCreateRequest request) throws BadRequestException, NotFoundExeception;
    EnrollmentResponse drop(Long enrollmentId) throws BadRequestException, NotFoundExeception;
    List<EnrollmentResponse> findByStudentId(Long studentId);
    List<EnrollmentResponse> findByClassId(Long classId);
    EnrollmentResponse transfer(TransferRequest request) throws BadRequestException, NotFoundExeception;
    Enrollment getEnrollment(Long studentId, Long classId) throws BadRequestException;
}
