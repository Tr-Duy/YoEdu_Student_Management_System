package com.yo.day1.common.exception;
// lỗi yêu cầu không hợp lệ
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
