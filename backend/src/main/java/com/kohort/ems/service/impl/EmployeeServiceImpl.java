package com.kohort.ems.service.impl;

import com.kohort.ems.dto.EmployeeRequestDTO;
import com.kohort.ems.dto.EmployeeResponseDTO;
import com.kohort.ems.dto.PaginatedResponseDTO;
import com.kohort.ems.exception.DuplicateResourceException;
import com.kohort.ems.exception.ResourceNotFoundException;
import com.kohort.ems.model.Department;
import com.kohort.ems.model.Employee;
import com.kohort.ems.model.EmploymentStatus;
import com.kohort.ems.repository.DepartmentRepository;
import com.kohort.ems.repository.EmployeeRepository;
import com.kohort.ems.service.EmployeeService;
import com.opencsv.CSVWriter;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    public EmployeeServiceImpl(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
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
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String safeSortBy = (sortBy != null && !sortBy.isBlank()) ? sortBy : "id";
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(direction, safeSortBy));

        Specification<Employee> spec = buildSpecification(search, departmentId, status);
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
    @Transactional(readOnly = true)
    public EmployeeResponseDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return mapToDTO(employee);
    }

    @Override
    public EmployeeResponseDTO createEmployee(EmployeeRequestDTO dto) {
        String empId = dto.getEmployeeId().trim();
        String email = dto.getEmail().trim().toLowerCase();

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
                .build();

        Employee saved = employeeRepository.save(employee);
        return mapToDTO(saved);
    }

    @Override
    public EmployeeResponseDTO updateEmployee(Long id, EmployeeRequestDTO dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        String empId = dto.getEmployeeId().trim();
        String email = dto.getEmail().trim().toLowerCase();

        if (employeeRepository.existsByEmployeeIdAndIdNot(empId, id)) {
            throw new DuplicateResourceException("Employee with ID '" + empId + "' already exists");
        }
        if (employeeRepository.existsByEmailAndIdNot(email, id)) {
            throw new DuplicateResourceException("Employee with email '" + email + "' already exists");
        }

        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + dto.getDepartmentId()));

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
        return mapToDTO(updated);
    }

    @Override
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        employeeRepository.delete(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportEmployeesToCsv(String search, Long departmentId, EmploymentStatus status) {
        Specification<Employee> spec = buildSpecification(search, departmentId, status);
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
                    "Salary",
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

    private Specification<Employee> buildSpecification(String search, Long departmentId, EmploymentStatus status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

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
                .build();
    }
}
