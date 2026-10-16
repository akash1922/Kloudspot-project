package com.kohort.ems.service.impl;

import com.kohort.ems.dto.*;
import com.kohort.ems.exception.BadRequestException;
import com.kohort.ems.exception.DuplicateResourceException;
import com.kohort.ems.exception.ResourceNotFoundException;
import com.kohort.ems.model.Department;
import com.kohort.ems.model.Employee;
import com.kohort.ems.model.EmployeeAuditLog;
import com.kohort.ems.model.EmploymentStatus;
import com.kohort.ems.repository.DepartmentRepository;
import com.kohort.ems.repository.EmployeeAuditLogRepository;
import com.kohort.ems.repository.EmployeeRepository;
import com.kohort.ems.service.EmployeeService;
import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeServiceImpl.class);

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeAuditLogRepository auditLogRepository;

    public EmployeeServiceImpl(EmployeeRepository employeeRepository,
                               DepartmentRepository departmentRepository,
                               EmployeeAuditLogRepository auditLogRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Automated Background Daemon: Runs every hour to permanently purge records
     * that have exceeded the 13-day TTL policy.
     */
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void scheduledTtlPurge() {
        purgeExpiredArchives();
    }

    @Override
    @Transactional
    public void purgeExpiredArchives() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(13);
        List<Employee> expired = employeeRepository.findByArchivedTrueAndArchivedAtBefore(cutoff);
        if (!expired.isEmpty()) {
            for (Employee emp : expired) {
                auditLogRepository.deleteByEmployeeId(emp.getId());
            }
            auditLogRepository.flush();
            employeeRepository.deleteAll(expired);
            employeeRepository.flush();
            log.info("13-Day TTL Policy: Purged {} employee record(s) older than 13 days.", expired.size());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponseDTO<EmployeeResponseDTO> getEmployees(
            String search,
            Long departmentId,
            EmploymentStatus status,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        // Enforce 13-day TTL purge on query
        purgeExpiredArchives();

        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String safeSortBy = (sortBy != null && !sortBy.isBlank()) ? sortBy : "id";
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(direction, safeSortBy));

        Specification<Employee> spec = buildSpecification(search, departmentId, status, false);
        Page<Employee> employeePage = employeeRepository.findAll(spec, pageable);

        List<EmployeeResponseDTO> dtos = employeePage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return PaginatedResponseDTO.<EmployeeResponseDTO>builder()
                .content(dtos)
                .pageNumber(employeePage.getNumber())
                .pageSize(employeePage.getSize())
                .totalElements(employeePage.getTotalElements())
                .totalPages(employeePage.getTotalPages())
                .first(employeePage.isFirst())
                .last(employeePage.isLast())
                .hasNext(employeePage.hasNext())
                .hasPrevious(employeePage.hasPrevious())
                .build();
    }

    @Override
    @Transactional
    public List<EmployeeResponseDTO> getArchivedEmployees() {
        purgeExpiredArchives();
        LocalDateTime cutoff = LocalDateTime.now().minusDays(13);
        return employeeRepository.findByArchivedTrueOrderByArchivedAtDesc().stream()
                .filter(emp -> emp.getArchivedAt() == null || emp.getArchivedAt().isAfter(cutoff))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponseDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return mapToDTO(employee);
    }

    @Override
    public EmployeeResponseDTO createEmployee(EmployeeRequestDTO dto, String performedBy) {
        String empId = dto.getEmployeeId().trim();
        String email = dto.getEmail().trim().toLowerCase();

        if (!empId.toUpperCase().startsWith("EMP")) {
            throw new BadRequestException("Employee ID must start with 'EMP' (e.g. EMP1001)");
        }
        if (dto.getSalary() != null && dto.getSalary().compareTo(new BigDecimal("9999999.99")) > 0) {
            throw new BadRequestException("Salary cannot exceed 7 digits (maximum ₹99,99,999)");
        }
        if (employeeRepository.existsByEmployeeId(empId)) {
            throw new DuplicateResourceException("Employee with ID '" + empId + "' already exists");
        }
        if (employeeRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Employee with email '" + email + "' already exists");
        }

        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + dto.getDepartmentId()));

        Employee employee = Employee.builder()
                .employeeId(empId)
                .fullName(dto.getFullName().trim())
                .email(email)
                .phoneNumber(dto.getPhoneNumber().trim())
                .department(department)
                .designation(dto.getDesignation().trim())
                .dateOfJoining(dto.getDateOfJoining())
                .salary(dto.getSalary())
                .status(dto.getStatus())
                .archived(false)
                .build();

        Employee saved = employeeRepository.save(employee);

        // Record Audit Log with exact seconds
        auditLogRepository.save(EmployeeAuditLog.builder()
                .employeeId(saved.getId())
                .action("CREATED")
                .details("Employee record initialized. Assigned to " + department.getName() + " as " + saved.getDesignation() + ", Status: " + saved.getStatus())
                .performedBy(performedBy != null ? performedBy : "admin")
                .timestamp(LocalDateTime.now())
                .build());

        return mapToDTO(saved);
    }

    @Override
    public EmployeeResponseDTO updateEmployee(Long id, EmployeeRequestDTO dto, String performedBy) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        String empId = dto.getEmployeeId().trim();
        String email = dto.getEmail().trim().toLowerCase();

        if (!empId.toUpperCase().startsWith("EMP")) {
            throw new BadRequestException("Employee ID must start with 'EMP' (e.g. EMP1001)");
        }
        if (dto.getSalary() != null && dto.getSalary().compareTo(new BigDecimal("9999999.99")) > 0) {
            throw new BadRequestException("Salary cannot exceed 7 digits (maximum ₹99,99,999)");
        }
        if (employeeRepository.existsByEmployeeIdAndIdNot(empId, id)) {
            throw new DuplicateResourceException("Employee with ID '" + empId + "' already exists");
        }
        if (employeeRepository.existsByEmailAndIdNot(email, id)) {
            throw new DuplicateResourceException("Employee with email '" + email + "' already exists");
        }

        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + dto.getDepartmentId()));

        // Track diff for audit details
        List<String> changes = new ArrayList<>();
        if (!employee.getFullName().equals(dto.getFullName().trim())) {
            changes.add("Name: '" + employee.getFullName() + "' -> '" + dto.getFullName().trim() + "'");
        }
        if (!employee.getEmail().equalsIgnoreCase(email)) {
            changes.add("Email: '" + employee.getEmail() + "' -> '" + email + "'");
        }
        if (!employee.getPhoneNumber().equals(dto.getPhoneNumber().trim())) {
            changes.add("Phone: '" + employee.getPhoneNumber() + "' -> '" + dto.getPhoneNumber().trim() + "'");
        }
        if (!employee.getDepartment().getId().equals(department.getId())) {
            changes.add("Department: '" + employee.getDepartment().getName() + "' -> '" + department.getName() + "'");
        }
        if (!employee.getDesignation().equals(dto.getDesignation().trim())) {
            changes.add("Designation: '" + employee.getDesignation() + "' -> '" + dto.getDesignation().trim() + "'");
        }
        if (employee.getSalary().compareTo(dto.getSalary()) != 0) {
            changes.add("Salary: ₹" + employee.getSalary() + " -> ₹" + dto.getSalary());
        }
        if (!employee.getStatus().equals(dto.getStatus())) {
            changes.add("Status: " + employee.getStatus() + " -> " + dto.getStatus());
        }

        employee.setEmployeeId(empId);
        employee.setFullName(dto.getFullName().trim());
        employee.setEmail(email);
        employee.setPhoneNumber(dto.getPhoneNumber().trim());
        employee.setDepartment(department);
        employee.setDesignation(dto.getDesignation().trim());
        employee.setDateOfJoining(dto.getDateOfJoining());
        employee.setSalary(dto.getSalary());
        employee.setStatus(dto.getStatus());

        Employee updated = employeeRepository.save(employee);

        String diffSummary = changes.isEmpty() ? "Record re-saved without structural changes" : String.join("; ", changes);
        auditLogRepository.save(EmployeeAuditLog.builder()
                .employeeId(updated.getId())
                .action("UPDATED")
                .details(diffSummary)
                .performedBy(performedBy != null ? performedBy : "admin")
                .timestamp(LocalDateTime.now())
                .build());

        return mapToDTO(updated);
    }

    @Override
    public EmployeeResponseDTO toggleStatus(Long id, EmploymentStatus newStatus, String performedBy) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        EmploymentStatus oldStatus = employee.getStatus();
        employee.setStatus(newStatus);
        Employee updated = employeeRepository.save(employee);

        auditLogRepository.save(EmployeeAuditLog.builder()
                .employeeId(updated.getId())
                .action("STATUS_CHANGED")
                .details("Status transitioned from " + oldStatus + " to " + newStatus)
                .performedBy(performedBy != null ? performedBy : "admin")
                .timestamp(LocalDateTime.now())
                .build());

        return mapToDTO(updated);
    }

    @Override
    public void archiveEmployee(Long id, String performedBy) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        employee.setArchived(true);
        employee.setArchivedAt(LocalDateTime.now());
        employeeRepository.save(employee);

        auditLogRepository.save(EmployeeAuditLog.builder()
                .employeeId(employee.getId())
                .action("ARCHIVED")
                .details("Employee moved to Archive. 13-day TTL retention policy active.")
                .performedBy(performedBy != null ? performedBy : "admin")
                .timestamp(LocalDateTime.now())
                .build());
    }

    @Override
    public EmployeeResponseDTO restoreEmployee(Long id, String performedBy) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        employee.setArchived(false);
        employee.setArchivedAt(null);
        employee.setStatus(EmploymentStatus.Active);
        Employee saved = employeeRepository.save(employee);

        auditLogRepository.save(EmployeeAuditLog.builder()
                .employeeId(saved.getId())
                .action("RESTORED")
                .details("Employee restored from Archive back into directory as Active.")
                .performedBy(performedBy != null ? performedBy : "admin")
                .timestamp(LocalDateTime.now())
                .build());

        return mapToDTO(saved);
    }

    @Override
    public void permanentlyDeleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        auditLogRepository.deleteByEmployeeId(id);
        employeeRepository.delete(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeAuditLogDTO> getAuditLogs(Long employeeId) {
        return auditLogRepository.findByEmployeeIdOrderByTimestampDesc(employeeId).stream()
                .map(log -> EmployeeAuditLogDTO.builder()
                        .id(log.getId())
                        .employeeId(log.getEmployeeId())
                        .action(log.getAction())
                        .details(log.getDetails())
                        .performedBy(log.getPerformedBy())
                        .timestamp(log.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public CsvImportResultDTO importEmployeesCsv(MultipartFile file, String performedBy) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded CSV file is empty");
        }

        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int rowIdx = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVReader csvReader = new CSVReader(reader)) {

            String[] line;
            boolean isHeader = true;

            while ((line = csvReader.readNext()) != null) {
                rowIdx++;
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                if (line.length < 8) {
                    errors.add("Row " + rowIdx + ": Insufficient columns (expected at least 8 columns)");
                    continue;
                }

                String empId = line[0].trim();
                String name = line[1].trim();
                String email = line[2].trim().toLowerCase();
                String phone = line[3].trim();
                String deptName = line[4].trim();
                String designation = line[5].trim();
                String dojStr = line[6].trim();
                String salaryStr = line[7].trim().replace("₹", "").replace(",", "").trim();
                String statusStr = line.length > 8 ? line[8].trim() : "Active";

                if (empId.isBlank() || name.isBlank() || email.isBlank()) {
                    errors.add("Row " + rowIdx + ": Employee ID, Name, and Email are mandatory");
                    continue;
                }

                if (!empId.toUpperCase().startsWith("EMP")) {
                    errors.add("Row " + rowIdx + ": Employee ID must start with 'EMP' (found '" + empId + "')");
                    continue;
                }

                if (employeeRepository.existsByEmployeeId(empId)) {
                    errors.add("Row " + rowIdx + ": Employee ID '" + empId + "' already exists");
                    continue;
                }

                if (employeeRepository.existsByEmail(email)) {
                    errors.add("Row " + rowIdx + ": Email '" + email + "' already registered");
                    continue;
                }

                if (deptName.isBlank()) {
                    errors.add("Row " + rowIdx + ": Department is required");
                    continue;
                }

                Department dept = departmentRepository.findByNameIgnoreCase(deptName).orElse(null);
                if (dept == null) {
                    errors.add("Row " + rowIdx + ": Department '" + deptName + "' does not exist");
                    continue;
                }

                if (designation.isBlank()) {
                    errors.add("Row " + rowIdx + ": Designation is required");
                    continue;
                }

                if (phone.isBlank()) {
                    errors.add("Row " + rowIdx + ": Phone number is required");
                    continue;
                }
                String cleanPhone = phone.replaceAll("\\D", "");
                if (cleanPhone.length() < 10) {
                    errors.add("Row " + rowIdx + ": Phone number must contain at least 10 digits");
                    continue;
                }
                String last10 = cleanPhone.substring(cleanPhone.length() - 10);
                if (!last10.matches("^[6-9]\\d{9}$")) {
                    errors.add("Row " + rowIdx + ": Phone number must be a valid 10-digit Indian mobile starting with 6, 7, 8, or 9");
                    continue;
                }
                String formattedPhone = "+91 " + last10;

                if (dojStr.isBlank()) {
                    errors.add("Row " + rowIdx + ": Date of Joining is required");
                    continue;
                }
                LocalDate doj;
                try {
                    doj = LocalDate.parse(dojStr);
                    if (doj.isAfter(LocalDate.now())) {
                        errors.add("Row " + rowIdx + ": Date of Joining cannot be in the future ('" + dojStr + "')");
                        continue;
                    }
                } catch (Exception e) {
                    errors.add("Row " + rowIdx + ": Invalid Date of Joining ('" + dojStr + "'). Expected format: YYYY-MM-DD");
                    continue;
                }

                if (salaryStr.isBlank()) {
                    errors.add("Row " + rowIdx + ": Salary is required");
                    continue;
                }
                BigDecimal salary;
                try {
                    salary = new BigDecimal(salaryStr);
                    if (salary.compareTo(BigDecimal.ZERO) <= 0) {
                        errors.add("Row " + rowIdx + ": Salary must be greater than 0");
                        continue;
                    }
                    if (salary.compareTo(new BigDecimal("9999999.99")) > 0) {
                        errors.add("Row " + rowIdx + ": Salary cannot exceed 7 digits (maximum ₹99,99,999)");
                        continue;
                    }
                } catch (Exception e) {
                    errors.add("Row " + rowIdx + ": Invalid Salary value ('" + salaryStr + "'). Must be a valid positive number");
                    continue;
                }

                EmploymentStatus status = "Inactive".equalsIgnoreCase(statusStr)
                        ? EmploymentStatus.Inactive
                        : EmploymentStatus.Active;

                Employee newEmp = Employee.builder()
                        .employeeId(empId)
                        .fullName(name)
                        .email(email)
                        .phoneNumber(formattedPhone)
                        .department(dept)
                        .designation(designation)
                        .dateOfJoining(doj)
                        .salary(salary)
                        .status(status)
                        .archived(false)
                        .build();

                Employee saved = employeeRepository.save(newEmp);

                auditLogRepository.save(EmployeeAuditLog.builder()
                        .employeeId(saved.getId())
                        .action("CREATED")
                        .details("Bulk imported via CSV. Initial Department: " + dept.getName())
                        .performedBy(performedBy != null ? performedBy : "admin")
                        .timestamp(LocalDateTime.now())
                        .build());

                successCount++;
            }

        } catch (Exception e) {
            throw new BadRequestException("Failed to process CSV file: " + e.getMessage());
        }

        return new CsvImportResultDTO(rowIdx - 1, successCount, errors.size(), errors);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportEmployeesToCsv(String search, Long departmentId, EmploymentStatus status) {
        Specification<Employee> spec = buildSpecification(search, departmentId, status, false);
        List<Employee> employees = employeeRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "fullName"));

        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
             CSVWriter csvWriter = new CSVWriter(writer)) {

            String[] header = {
                    "Employee ID",
                    "Full Name",
                    "Email Address",
                    "Phone Number",
                    "Department",
                    "Designation",
                    "Date of Joining",
                    "Salary (INR)",
                    "Employment Status"
            };
            csvWriter.writeNext(header);

            for (Employee emp : employees) {
                String[] row = {
                        emp.getEmployeeId(),
                        emp.getFullName(),
                        emp.getEmail(),
                        emp.getPhoneNumber(),
                        emp.getDepartment() != null ? emp.getDepartment().getName() : "",
                        emp.getDesignation(),
                        emp.getDateOfJoining() != null ? emp.getDateOfJoining().toString() : "",
                        emp.getSalary() != null ? emp.getSalary().toString() : "",
                        emp.getStatus() != null ? emp.getStatus().name() : ""
                };
                csvWriter.writeNext(row);
            }

            csvWriter.flush();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CSV export: " + e.getMessage(), e);
        }
    }

    private Specification<Employee> buildSpecification(String search, Long departmentId, EmploymentStatus status, boolean archived) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("archived"), archived));

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("fullName")), pattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), pattern);
                Predicate empIdMatch = cb.like(cb.lower(root.get("employeeId")), pattern);
                predicates.add(cb.or(nameMatch, emailMatch, empIdMatch));
            }

            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private EmployeeResponseDTO mapToDTO(Employee emp) {
        Long ttlDays = null;
        if (emp.isArchived() && emp.getArchivedAt() != null) {
            long daysPassed = ChronoUnit.DAYS.between(emp.getArchivedAt(), LocalDateTime.now());
            ttlDays = Math.max(1, 13 - daysPassed);
        }

        return EmployeeResponseDTO.builder()
                .id(emp.getId())
                .employeeId(emp.getEmployeeId())
                .fullName(emp.getFullName())
                .email(emp.getEmail())
                .phoneNumber(emp.getPhoneNumber())
                .departmentId(emp.getDepartment() != null ? emp.getDepartment().getId() : null)
                .departmentName(emp.getDepartment() != null ? emp.getDepartment().getName() : null)
                .designation(emp.getDesignation())
                .dateOfJoining(emp.getDateOfJoining())
                .salary(emp.getSalary())
                .status(emp.getStatus())
                .createdAt(emp.getCreatedAt())
                .updatedAt(emp.getUpdatedAt())
                .archived(emp.isArchived())
                .archivedAt(emp.getArchivedAt())
                .ttlDaysRemaining(ttlDays)
                .build();
    }
}
