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
 * No real database connection is required; Mockito mocks repository behaviors.
 */
@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

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
                .phoneNumber("+1 (555) 123-4567")
                .department(sampleDepartment)
                .designation("Staff Engineer")
                .dateOfJoining(LocalDate.of(2023, 1, 15))
                .salary(new BigDecimal("120000.00"))
                .status(EmploymentStatus.Active)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        validRequestDTO = EmployeeRequestDTO.builder()
                .employeeId("EMP-1001")
                .fullName("Jane Doe")
                .email("jane.doe@company.com")
                .phoneNumber("+1 (555) 123-4567")
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
        EmployeeResponseDTO result = employeeService.createEmployee(validRequestDTO);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEmployeeId()).isEqualTo("EMP-1001");
        assertThat(result.getEmail()).isEqualTo("jane.doe@company.com");
        assertThat(result.getDepartmentName()).isEqualTo("Engineering");
        verify(employeeRepository, times(1)).save(any(Employee.class));
    }

    @Test
    @DisplayName("createEmployee: should throw DuplicateResourceException when employeeId already exists")
    void createEmployee_DuplicateEmployeeId() {
        // Given
        when(employeeRepository.existsByEmployeeId("EMP-1001")).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> employeeService.createEmployee(validRequestDTO))
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
        assertThatThrownBy(() -> employeeService.createEmployee(validRequestDTO))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Employee with email 'jane.doe@company.com' already exists");

        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    @DisplayName("createEmployee: should throw ResourceNotFoundException when department does not exist")
    void createEmployee_DepartmentNotFound() {
        // Given
        when(employeeRepository.existsByEmployeeId("EMP-1001")).thenReturn(false);
        when(employeeRepository.existsByEmail("jane.doe@company.com")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> employeeService.createEmployee(validRequestDTO))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Department not found with id: 1");

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
    @DisplayName("getEmployeeById: should throw ResourceNotFoundException when ID does not exist")
    void getEmployeeById_NotFound() {
        // Given
        when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> employeeService.getEmployeeById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Employee not found with id: 999");
    }

    @Test
    @DisplayName("updateEmployee: should successfully update employee data")
    void updateEmployee_Success() {
        // Given
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(sampleEmployee));
        when(employeeRepository.existsByEmployeeIdAndIdNot("EMP-1001", 100L)).thenReturn(false);
        when(employeeRepository.existsByEmailAndIdNot("jane.doe@company.com", 100L)).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(sampleDepartment));
        when(employeeRepository.save(any(Employee.class))).thenReturn(sampleEmployee);

        // When
        EmployeeResponseDTO result = employeeService.updateEmployee(100L, validRequestDTO);

        // Then
        assertThat(result).isNotNull();
        verify(employeeRepository, times(1)).save(any(Employee.class));
    }

    @Test
    @DisplayName("deleteEmployee: should delete employee when ID exists")
    void deleteEmployee_Success() {
        // Given
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(sampleEmployee));
        doNothing().when(employeeRepository).delete(sampleEmployee);

        // When
        employeeService.deleteEmployee(100L);

        // Then
        verify(employeeRepository, times(1)).delete(sampleEmployee);
    }

    @Test
    @DisplayName("deleteEmployee: should throw ResourceNotFoundException when employee does not exist")
    void deleteEmployee_NotFound() {
        // Given
        when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> employeeService.deleteEmployee(999L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(employeeRepository, never()).delete(any(Employee.class));
    }

    @Test
    @DisplayName("getEmployees: should return paginated list of employees")
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
        assertThat(result.isFirst()).isTrue();
    }

    @Test
    @DisplayName("exportEmployeesToCsv: should generate non-empty CSV byte array with employee data")
    @SuppressWarnings("unchecked")
    void exportEmployeesToCsv_Success() {
        // Given
        when(employeeRepository.findAll(any(Specification.class), any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of(sampleEmployee));

        // When
        byte[] csvBytes = employeeService.exportEmployeesToCsv(null, null, null);

        // Then
        assertThat(csvBytes).isNotEmpty();
        String csvContent = new String(csvBytes);
        assertThat(csvContent).contains("Employee ID", "Full Name", "EMP-1001", "Jane Doe");
    }
}
