package com.yo.day1.common.exception;
// lỗi xung đột
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
