//kiem tra du an co chay hay khong

package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping("/api/health")
    public ApiResponse<String> headth(){
        return ApiResponse.success("YOEDU backend is running");
    }
    @PostMapping("/api/health/echo")
    public  ApiResponse<String> echo(@Valid @RequestBody EchoRequest request){
        return ApiResponse.success(request.message());
    }
    public record EchoRequest(@NotBlank(message = "message must not be blank")String message){

    }
}
