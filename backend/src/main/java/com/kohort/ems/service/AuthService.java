package com.kohort.ems.service;

import com.kohort.ems.dto.ApiResponseDTO;
import com.kohort.ems.dto.LoginRequestDTO;
import com.kohort.ems.dto.LoginResponseDTO;
import com.kohort.ems.dto.RegisterRequestDTO;

public interface AuthService {
    LoginResponseDTO login(LoginRequestDTO dto);
    ApiResponseDTO<String> register(RegisterRequestDTO dto);
}
