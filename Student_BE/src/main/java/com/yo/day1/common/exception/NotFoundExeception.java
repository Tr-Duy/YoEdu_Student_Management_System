package com.yo.day1.common.exception;
// lỗi không tìm thấy
public class NotFoundExeception extends RuntimeException {
    public NotFoundExeception(String message) {
        super(message);
    }
}
