package com.kohort.ems.controller;

import com.kohort.ems.dto.ApiResponseDTO;
import com.kohort.ems.dto.EmployeeRequestDTO;
import com.kohort.ems.dto.EmployeeResponseDTO;
import com.kohort.ems.dto.PaginatedResponseDTO;
import com.kohort.ems.model.EmploymentStatus;
import com.kohort.ems.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employees")
@Tag(name = "Employees", description = "Endpoints for employee CRUD, search, filter, pagination, and CSV export")
@SecurityRequirement(name = "BearerAuth")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @Operation(summary = "Get employees with pagination, search, and filters",
            description = "Search across full name, email, or employee ID. Filter by department ID and status. Sort dynamically.")
    public ResponseEntity<ApiResponseDTO<PaginatedResponseDTO<EmployeeResponseDTO>>> getEmployees(
            @Parameter(description = "Search term for full name, email, or employee ID")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by department ID")
            @RequestParam(required = false) Long departmentId,
            @Parameter(description = "Filter by employment status (Active/Inactive)")
            @RequestParam(required = false) EmploymentStatus status,
            @Parameter(description = "0-based page number")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Field name to sort by (e.g., id, fullName, salary, dateOfJoining)")
            @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction: asc or desc")
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        PaginatedResponseDTO<EmployeeResponseDTO> result = employeeService.getEmployees(
                search, departmentId, status, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponseDTO.ok("Employees retrieved successfully", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee details by ID")
    public ResponseEntity<ApiResponseDTO<EmployeeResponseDTO>> getEmployeeById(@PathVariable Long id) {
        EmployeeResponseDTO result = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(ApiResponseDTO.ok("Employee details retrieved successfully", result));
    }

    @PostMapping
    @Operation(summary = "Create a new employee")
    public ResponseEntity<ApiResponseDTO<EmployeeResponseDTO>> createEmployee(
            @Valid @RequestBody EmployeeRequestDTO request
    ) {
        EmployeeResponseDTO result = employeeService.createEmployee(request);
        return new ResponseEntity<>(ApiResponseDTO.ok("Employee created successfully", result), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing employee")
    public ResponseEntity<ApiResponseDTO<EmployeeResponseDTO>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequestDTO request
    ) {
        EmployeeResponseDTO result = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(ApiResponseDTO.ok("Employee updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an employee by ID")
    public ResponseEntity<ApiResponseDTO<Void>> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponseDTO.ok("Employee deleted successfully"));
    }

    @GetMapping("/export/csv")
    @Operation(summary = "Export filtered employee records to CSV")
    public ResponseEntity<byte[]> exportEmployeesCsv(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) EmploymentStatus status
    ) {
        byte[] csvData = employeeService.exportEmployeesToCsv(search, departmentId, status);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "employees.csv");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }
}
