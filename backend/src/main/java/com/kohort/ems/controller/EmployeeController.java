package com.kohort.ems.controller;

import com.kohort.ems.dto.*;
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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@Tag(name = "Employees", description = "Endpoints for employee CRUD, search, filter, pagination, audit logs, archive, and CSV export/import")
@SecurityRequirement(name = "BearerAuth")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    private String getUsername(Authentication auth) {
        return auth != null ? auth.getName() : "admin";
    }

    @GetMapping
    @Operation(summary = "Get employees with pagination, search, and filters")
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
            @Parameter(description = "Field name to sort by")
            @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction: asc or desc")
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        PaginatedResponseDTO<EmployeeResponseDTO> result = employeeService.getEmployees(
                search, departmentId, status, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponseDTO.ok("Employees retrieved successfully", result));
    }

    @GetMapping({"/archived", "/archive"})
    @Operation(summary = "Get archived employees with 13-day TTL status")
    public ResponseEntity<ApiResponseDTO<List<EmployeeResponseDTO>>> getArchivedEmployees() {
        List<EmployeeResponseDTO> result = employeeService.getArchivedEmployees();
        return ResponseEntity.ok(ApiResponseDTO.ok("Archived employees retrieved successfully", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee details by ID")
    public ResponseEntity<ApiResponseDTO<EmployeeResponseDTO>> getEmployeeById(@PathVariable Long id) {
        EmployeeResponseDTO result = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(ApiResponseDTO.ok("Employee details retrieved successfully", result));
    }

    @GetMapping("/{id}/audit-logs")
    @Operation(summary = "Get audit edit trail and history for an employee")
    public ResponseEntity<ApiResponseDTO<List<EmployeeAuditLogDTO>>> getAuditLogs(@PathVariable Long id) {
        List<EmployeeAuditLogDTO> logs = employeeService.getAuditLogs(id);
        return ResponseEntity.ok(ApiResponseDTO.ok("Audit logs retrieved successfully", logs));
    }

    @PostMapping
    @Operation(summary = "Create a new employee")
    public ResponseEntity<ApiResponseDTO<EmployeeResponseDTO>> createEmployee(
            @Valid @RequestBody EmployeeRequestDTO request,
            Authentication auth
    ) {
        EmployeeResponseDTO result = employeeService.createEmployee(request, getUsername(auth));
        return new ResponseEntity<>(ApiResponseDTO.ok("Employee created successfully", result), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing employee")
    public ResponseEntity<ApiResponseDTO<EmployeeResponseDTO>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequestDTO request,
            Authentication auth
    ) {
        EmployeeResponseDTO result = employeeService.updateEmployee(id, request, getUsername(auth));
        return ResponseEntity.ok(ApiResponseDTO.ok("Employee updated successfully", result));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Quick toggle employee status (Active/Inactive) with audit log")
    public ResponseEntity<ApiResponseDTO<EmployeeResponseDTO>> toggleStatus(
            @PathVariable Long id,
            @RequestParam EmploymentStatus status,
            Authentication auth
    ) {
        EmployeeResponseDTO result = employeeService.toggleStatus(id, status, getUsername(auth));
        return ResponseEntity.ok(ApiResponseDTO.ok("Employee status updated to " + status, result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Move employee to Archive (13-day TTL retention)")
    public ResponseEntity<ApiResponseDTO<Void>> archiveEmployee(
            @PathVariable Long id,
            Authentication auth
    ) {
        employeeService.archiveEmployee(id, getUsername(auth));
        return ResponseEntity.ok(ApiResponseDTO.ok("Employee moved to archive (13-day retention policy active)"));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore employee from Archive back to active directory")
    public ResponseEntity<ApiResponseDTO<EmployeeResponseDTO>> restoreEmployee(
            @PathVariable Long id,
            Authentication auth
    ) {
        EmployeeResponseDTO restored = employeeService.restoreEmployee(id, getUsername(auth));
        return ResponseEntity.ok(ApiResponseDTO.ok("Employee restored successfully", restored));
    }

    @DeleteMapping("/{id}/permanent")
    @Operation(summary = "Permanently purge employee from database")
    public ResponseEntity<ApiResponseDTO<Void>> permanentlyDeleteEmployee(@PathVariable Long id) {
        employeeService.permanentlyDeleteEmployee(id);
        return ResponseEntity.ok(ApiResponseDTO.ok("Employee permanently purged from database"));
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

    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Bulk import employees via CSV file")
    public ResponseEntity<ApiResponseDTO<CsvImportResultDTO>> importEmployeesCsv(
            @RequestParam("file") MultipartFile file,
            Authentication auth
    ) {
        CsvImportResultDTO result = employeeService.importEmployeesCsv(file, getUsername(auth));
        return ResponseEntity.ok(ApiResponseDTO.ok("CSV import completed", result));
    }
}
