package com.kohort.ems.service;

import com.kohort.ems.dto.EmployeeRequestDTO;
import com.kohort.ems.dto.EmployeeResponseDTO;
import com.kohort.ems.dto.PaginatedResponseDTO;
import com.kohort.ems.exception.DuplicateResourceException;
import com.kohort.ems.exception.ResourceNotFoundException;
import com.kohort.ems.model.Department;
import com.kohort.ems.model.Employee;
import com.kohort.ems.model.EmploymentStatus;
import com.kohort.ems.repository.DepartmentRepository;
import com.kohort.ems.repository.EmployeeAuditLogRepository;
import com.kohort.ems.repository.EmployeeRepository;
import com.kohort.ems.service.impl.EmployeeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Service-layer unit tests for Employee management logic using JUnit 5 and Mockito.
 */
@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private EmployeeAuditLogRepository auditLogRepository;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    private Department sampleDepartment;
    private Employee sampleEmployee;
    private EmployeeRequestDTO validRequestDTO;

    @BeforeEach
    void setUp() {
        sampleDepartment = Department.builder()
                .id(1L)
                .name("Engineering")
                .description("Software Development")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        sampleEmployee = Employee.builder()
                .id(100L)
                .employeeId("EMP-1001")
                .fullName("Jane Doe")
                .email("jane.doe@company.com")
                .phoneNumber("+91 9876543210")
                .department(sampleDepartment)
                .designation("Staff Engineer")
                .dateOfJoining(LocalDate.of(2023, 1, 15))
                .salary(new BigDecimal("120000.00"))
                .status(EmploymentStatus.Active)
                .archived(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        validRequestDTO = EmployeeRequestDTO.builder()
                .employeeId("EMP-1001")
                .fullName("Jane Doe")
                .email("jane.doe@company.com")
                .phoneNumber("+91 9876543210")
                .departmentId(1L)
                .designation("Staff Engineer")
                .dateOfJoining(LocalDate.of(2023, 1, 15))
                .salary(new BigDecimal("120000.00"))
                .status(EmploymentStatus.Active)
                .build();
    }

    @Test
    @DisplayName("createEmployee: should save and return EmployeeResponseDTO when inputs are valid")
    void createEmployee_Success() {
        // Given
        when(employeeRepository.existsByEmployeeId("EMP-1001")).thenReturn(false);
        when(employeeRepository.existsByEmail("jane.doe@company.com")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(sampleDepartment));
        when(employeeRepository.save(any(Employee.class))).thenReturn(sampleEmployee);

        // When
        EmployeeResponseDTO result = employeeService.createEmployee(validRequestDTO, "admin");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEmployeeId()).isEqualTo("EMP-1001");
        assertThat(result.getEmail()).isEqualTo("jane.doe@company.com");
        assertThat(result.getDepartmentName()).isEqualTo("Engineering");
        verify(employeeRepository, times(1)).save(any(Employee.class));
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("createEmployee: should throw DuplicateResourceException when employeeId already exists")
    void createEmployee_DuplicateEmployeeId() {
        // Given
        when(employeeRepository.existsByEmployeeId("EMP-1001")).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> employeeService.createEmployee(validRequestDTO, "admin"))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Employee with ID 'EMP-1001' already exists");

        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    @DisplayName("createEmployee: should throw DuplicateResourceException when email already exists")
    void createEmployee_DuplicateEmail() {
        // Given
        when(employeeRepository.existsByEmployeeId("EMP-1001")).thenReturn(false);
        when(employeeRepository.existsByEmail("jane.doe@company.com")).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> employeeService.createEmployee(validRequestDTO, "admin"))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Employee with email 'jane.doe@company.com' already exists");

        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    @DisplayName("getEmployeeById: should return employee details when ID exists")
    void getEmployeeById_Success() {
        // Given
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(sampleEmployee));

        // When
        EmployeeResponseDTO result = employeeService.getEmployeeById(100L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(100L);
        assertThat(result.getFullName()).isEqualTo("Jane Doe");
    }

    @Test
    @DisplayName("updateEmployee: should successfully update employee data and create audit log")
    void updateEmployee_Success() {
        // Given
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(sampleEmployee));
        when(employeeRepository.existsByEmployeeIdAndIdNot("EMP-1001", 100L)).thenReturn(false);
        when(employeeRepository.existsByEmailAndIdNot("jane.doe@company.com", 100L)).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(sampleDepartment));
        when(employeeRepository.save(any(Employee.class))).thenReturn(sampleEmployee);

        // When
        EmployeeResponseDTO result = employeeService.updateEmployee(100L, validRequestDTO, "admin");

        // Then
        assertThat(result).isNotNull();
        verify(employeeRepository, times(1)).save(any(Employee.class));
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("toggleStatus: should flip status and record audit log")
    void toggleStatus_Success() {
        // Given
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(sampleEmployee));
        when(employeeRepository.save(any(Employee.class))).thenReturn(sampleEmployee);

        // When
        EmployeeResponseDTO result = employeeService.toggleStatus(100L, EmploymentStatus.Inactive, "admin");

        // Then
        assertThat(result).isNotNull();
        verify(employeeRepository, times(1)).save(any(Employee.class));
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("archiveEmployee: should set archived flag and record audit log")
    void archiveEmployee_Success() {
        // Given
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(sampleEmployee));
        when(employeeRepository.save(any(Employee.class))).thenReturn(sampleEmployee);

        // When
        employeeService.archiveEmployee(100L, "admin");

        // Then
        verify(employeeRepository, times(1)).save(any(Employee.class));
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("restoreEmployee: should clear archived flag and set Active")
    void restoreEmployee_Success() {
        // Given
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(sampleEmployee));
        when(employeeRepository.save(any(Employee.class))).thenReturn(sampleEmployee);

        // When
        EmployeeResponseDTO result = employeeService.restoreEmployee(100L, "admin");

        // Then
        assertThat(result).isNotNull();
        verify(employeeRepository, times(1)).save(any(Employee.class));
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("getEmployees: should return paginated list of non-archived employees")
    @SuppressWarnings("unchecked")
    void getEmployees_ReturnsPaginatedList() {
        // Given
        Page<Employee> page = new PageImpl<>(List.of(sampleEmployee));
        when(employeeRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        // When
        PaginatedResponseDTO<EmployeeResponseDTO> result = employeeService.getEmployees(
                null, null, null, 0, 10, "id", "asc"
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("13-Day TTL: purgeExpiredArchives should delete records archived > 13 days ago and clean audit logs")
    void purgeExpiredArchives_DeletesExpiredRecords() {
        // Given
        Employee expiredEmployee = Employee.builder()
                .id(200L)
                .employeeId("EMP999")
                .fullName("Expired Employee")
                .email("expired@kohort.com")
                .archived(true)
                .archivedAt(LocalDateTime.now().minusDays(14))
                .build();

        when(employeeRepository.findByArchivedTrueAndArchivedAtBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(expiredEmployee));

        // When
        employeeService.purgeExpiredArchives();

        // Then
        verify(auditLogRepository, times(1)).deleteByEmployeeId(200L);
        verify(auditLogRepository, times(1)).flush();
        verify(employeeRepository, times(1)).deleteAll(List.of(expiredEmployee));
        verify(employeeRepository, times(1)).flush();
    }

    @Test
    @DisplayName("13-Day TTL: purgeExpiredArchives should do nothing when no records are older than 13 days")
    void purgeExpiredArchives_NoExpiredRecords_DoesNotDelete() {
        // Given
        when(employeeRepository.findByArchivedTrueAndArchivedAtBefore(any(LocalDateTime.class)))
                .thenReturn(List.of());

        // When
        employeeService.purgeExpiredArchives();

        // Then
        verify(auditLogRepository, never()).deleteByEmployeeId(anyLong());
        verify(employeeRepository, never()).deleteAll(anyList());
    }

    @Test
    @DisplayName("13-Day TTL: getArchivedEmployees should calculate positive remaining TTL days")
    void getArchivedEmployees_CalculatesRemainingTtlDays() {
        // Given
        Employee activeArchive = Employee.builder()
                .id(300L)
                .employeeId("EMP300")
                .fullName("Recent Archive")
                .email("archive@kohort.com")
                .phoneNumber("+91 9876543210")
                .designation("Dev")
                .salary(new BigDecimal("750000"))
                .status(EmploymentStatus.Inactive)
                .archived(true)
                .archivedAt(LocalDateTime.now().minusDays(3))
                .build();

        when(employeeRepository.findByArchivedTrueAndArchivedAtBefore(any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(employeeRepository.findByArchivedTrueOrderByArchivedAtDesc())
                .thenReturn(List.of(activeArchive));

        // When
        List<EmployeeResponseDTO> result = employeeService.getArchivedEmployees();

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTtlDaysRemaining()).isEqualTo(10L); // 13 - 3 = 10
    }
}
