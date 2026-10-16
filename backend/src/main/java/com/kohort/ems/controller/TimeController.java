package com.kohort.ems.controller;

import com.kohort.ems.dto.ApiResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/time")
@Tag(name = "Network Time", description = "Endpoints for synchronized network date/time")
public class TimeController {

    @GetMapping("/now")
    @Operation(summary = "Get synchronized server/network time to prevent local clock manipulation")
    public ResponseEntity<ApiResponseDTO<Map<String, Object>>> getNetworkTime() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        Map<String, Object> timeData = new HashMap<>();
        timeData.put("isoDate", today.toString());
        timeData.put("formattedDate", today.format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")));
        timeData.put("timestamp", now.format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss")));
        timeData.put("epochMilli", System.currentTimeMillis());

        return ResponseEntity.ok(ApiResponseDTO.ok("Network time synchronized", timeData));
    }
}
