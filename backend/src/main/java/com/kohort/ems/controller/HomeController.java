package com.kohort.ems.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@Tag(name = "Health & Root", description = "Root health status and API documentation entry point")
public class HomeController {

    @GetMapping("/")
    @Operation(summary = "Root health check and API entry point")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", "Kohort Employee Management System (EMS) Backend");
        response.put("status", "UP");
        response.put("version", "1.0.0");
        response.put("swaggerDocs", "/swagger-ui.html");
        response.put("apiDocs", "/v3/api-docs");
        return ResponseEntity.ok(response);
    }
}
