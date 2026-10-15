package com.kohort.ems.controller;

import com.kohort.ems.dto.ApiResponseDTO;
import com.kohort.ems.dto.DepartmentDTO;
import com.kohort.ems.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@Tag(name = "Departments", description = "Endpoints for department management")
@SecurityRequirement(name = "BearerAuth")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    @Operation(summary = "List all departments with employee counts")
    public ResponseEntity<ApiResponseDTO<List<DepartmentDTO>>> getAllDepartments() {
        List<DepartmentDTO> departments = departmentService.getAllDepartments();
        return ResponseEntity.ok(ApiResponseDTO.ok("Departments retrieved successfully", departments));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get department by ID")
    public ResponseEntity<ApiResponseDTO<DepartmentDTO>> getDepartmentById(@PathVariable Long id) {
        DepartmentDTO department = departmentService.getDepartmentById(id);
        return ResponseEntity.ok(ApiResponseDTO.ok("Department retrieved successfully", department));
    }

    @PostMapping
    @Operation(summary = "Create a new department")
    public ResponseEntity<ApiResponseDTO<DepartmentDTO>> createDepartment(@Valid @RequestBody DepartmentDTO dto) {
        DepartmentDTO created = departmentService.createDepartment(dto);
        return new ResponseEntity<>(ApiResponseDTO.ok("Department created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing department")
    public ResponseEntity<ApiResponseDTO<DepartmentDTO>> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentDTO dto
    ) {
        DepartmentDTO updated = departmentService.updateDepartment(id, dto);
        return ResponseEntity.ok(ApiResponseDTO.ok("Department updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete department (only if no employees are assigned)")
    public ResponseEntity<ApiResponseDTO<Void>> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponseDTO.ok("Department deleted successfully"));
    }
}
