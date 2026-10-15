package com.kohort.ems.service;

import com.kohort.ems.dto.DepartmentDTO;
import com.kohort.ems.exception.BadRequestException;
import com.kohort.ems.exception.DuplicateResourceException;
import com.kohort.ems.exception.ResourceNotFoundException;
import com.kohort.ems.model.Department;
import com.kohort.ems.repository.DepartmentRepository;
import com.kohort.ems.repository.EmployeeRepository;
import com.kohort.ems.service.impl.DepartmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Service-layer unit tests for Department management logic using JUnit 5 and Mockito.
 */
@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private DepartmentServiceImpl departmentService;

    private Department sampleDepartment;
    private DepartmentDTO sampleDTO;

    @BeforeEach
    void setUp() {
        sampleDepartment = Department.builder()
                .id(1L)
                .name("Engineering")
                .description("Software development")
                .build();

        sampleDTO = DepartmentDTO.builder()
                .name("Engineering")
                .description("Software development")
                .build();
    }

    @Test
    @DisplayName("getAllDepartments: should return list of departments with employee count")
    void getAllDepartments_Success() {
        // Given
        when(departmentRepository.findAll()).thenReturn(List.of(sampleDepartment));
        when(employeeRepository.countByDepartmentId(1L)).thenReturn(5L);

        // When
        List<DepartmentDTO> result = departmentService.getAllDepartments();

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Engineering");
        assertThat(result.get(0).getEmployeeCount()).isEqualTo(5L);
    }

    @Test
    @DisplayName("createDepartment: should save and return department when name is unique")
    void createDepartment_Success() {
        // Given
        when(departmentRepository.existsByNameIgnoreCase("Engineering")).thenReturn(false);
        when(departmentRepository.save(any(Department.class))).thenReturn(sampleDepartment);
        when(employeeRepository.countByDepartmentId(1L)).thenReturn(0L);

        // When
        DepartmentDTO result = departmentService.createDepartment(sampleDTO);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Engineering");
        verify(departmentRepository, times(1)).save(any(Department.class));
    }

    @Test
    @DisplayName("createDepartment: should throw DuplicateResourceException when name exists")
    void createDepartment_DuplicateName() {
        // Given
        when(departmentRepository.existsByNameIgnoreCase("Engineering")).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> departmentService.createDepartment(sampleDTO))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists");

        verify(departmentRepository, never()).save(any(Department.class));
    }

    @Test
    @DisplayName("deleteDepartment: should throw BadRequestException if employees are still assigned")
    void deleteDepartment_HasEmployees() {
        // Given
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(sampleDepartment));
        when(employeeRepository.countByDepartmentId(1L)).thenReturn(3L);

        // When & Then
        assertThatThrownBy(() -> departmentService.deleteDepartment(1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot delete department");

        verify(departmentRepository, never()).delete(any(Department.class));
    }

    @Test
    @DisplayName("deleteDepartment: should successfully delete when no employees are assigned")
    void deleteDepartment_Success() {
        // Given
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(sampleDepartment));
        when(employeeRepository.countByDepartmentId(1L)).thenReturn(0L);
        doNothing().when(departmentRepository).delete(sampleDepartment);

        // When
        departmentService.deleteDepartment(1L);

        // Then
        verify(departmentRepository, times(1)).delete(sampleDepartment);
    }
}
