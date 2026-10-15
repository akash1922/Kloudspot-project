package com.kohort.ems.service.impl;

import com.kohort.ems.dto.ApiResponseDTO;
import com.kohort.ems.dto.LoginRequestDTO;
import com.kohort.ems.dto.LoginResponseDTO;
import com.kohort.ems.dto.RegisterRequestDTO;
import com.kohort.ems.exception.DuplicateResourceException;
import com.kohort.ems.model.User;
import com.kohort.ems.repository.UserRepository;
import com.kohort.ems.security.JwtTokenProvider;
import com.kohort.ems.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public LoginResponseDTO login(LoginRequestDTO dto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getUsername().trim(), dto.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(dto.getUsername().trim()).orElseThrow();

        return LoginResponseDTO.builder()
                .token(jwt)
                .type("Bearer")
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    @Override
    public ApiResponseDTO<String> register(RegisterRequestDTO dto) {
        String username = dto.getUsername().trim();
        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username '" + username + "' is already taken");
        }

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(dto.getPassword()))
                .role("ROLE_ADMIN")
                .build();

        userRepository.save(user);
        return ApiResponseDTO.ok("User registered successfully");
    }
}
