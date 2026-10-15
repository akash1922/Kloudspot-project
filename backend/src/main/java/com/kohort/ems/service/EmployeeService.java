package com.kohort.ems.service;

import com.kohort.ems.dto.EmployeeRequestDTO;
import com.kohort.ems.dto.EmployeeResponseDTO;
import com.kohort.ems.dto.PaginatedResponseDTO;
import com.kohort.ems.model.EmploymentStatus;

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

    EmployeeResponseDTO getEmployeeById(Long id);

    EmployeeResponseDTO createEmployee(EmployeeRequestDTO dto);

    EmployeeResponseDTO updateEmployee(Long id, EmployeeRequestDTO dto);

    void deleteEmployee(Long id);

    byte[] exportEmployeesToCsv(String search, Long departmentId, EmploymentStatus status);
}
