package com.kohort.ems.service;

import com.kohort.ems.dto.*;
import com.kohort.ems.model.EmploymentStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface EmployeeService {
    PaginatedResponseDTO<EmployeeResponseDTO> getEmployees(
            String search,
            Long departmentId,
            EmploymentStatus status,
            int page,
            int size,
            String sortBy,
            String sortDir
    );

    List<EmployeeResponseDTO> getArchivedEmployees();

    EmployeeResponseDTO getEmployeeById(Long id);

    EmployeeResponseDTO createEmployee(EmployeeRequestDTO dto, String performedBy);

    EmployeeResponseDTO updateEmployee(Long id, EmployeeRequestDTO dto, String performedBy);

    EmployeeResponseDTO toggleStatus(Long id, EmploymentStatus status, String performedBy);

    void archiveEmployee(Long id, String performedBy);

    EmployeeResponseDTO restoreEmployee(Long id, String performedBy);

    void permanentlyDeleteEmployee(Long id);

    byte[] exportEmployeesToCsv(String search, Long departmentId, EmploymentStatus status);

    CsvImportResultDTO importEmployeesCsv(MultipartFile file, String performedBy);

    List<EmployeeAuditLogDTO> getAuditLogs(Long employeeId);

    void purgeExpiredArchives();
}
