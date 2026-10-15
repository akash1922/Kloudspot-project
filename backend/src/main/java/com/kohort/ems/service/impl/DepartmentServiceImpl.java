package com.kohort.ems.service.impl;

import com.kohort.ems.dto.DepartmentDTO;
import com.kohort.ems.exception.BadRequestException;
import com.kohort.ems.exception.DuplicateResourceException;
import com.kohort.ems.exception.ResourceNotFoundException;
import com.kohort.ems.model.Department;
import com.kohort.ems.repository.DepartmentRepository;
import com.kohort.ems.repository.EmployeeRepository;
import com.kohort.ems.service.DepartmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    public DepartmentServiceImpl(DepartmentRepository departmentRepository, EmployeeRepository employeeRepository) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        return mapToDTO(department);
    }

    @Override
    public DepartmentDTO createDepartment(DepartmentDTO dto) {
        if (departmentRepository.existsByNameIgnoreCase(dto.getName().trim())) {
            throw new DuplicateResourceException("Department with name '" + dto.getName() + "' already exists");
        }

        Department department = Department.builder()
                .name(dto.getName().trim())
                .description(dto.getDescription())
                .build();

        Department saved = departmentRepository.save(department);
        return mapToDTO(saved);
    }

    @Override
    public DepartmentDTO updateDepartment(Long id, DepartmentDTO dto) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        if (departmentRepository.existsByNameIgnoreCaseAndIdNot(dto.getName().trim(), id)) {
            throw new DuplicateResourceException("Department with name '" + dto.getName() + "' already exists");
        }

        department.setName(dto.getName().trim());
        department.setDescription(dto.getDescription());

        Department updated = departmentRepository.save(department);
        return mapToDTO(updated);
    }

    @Override
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        long employeeCount = employeeRepository.countByDepartmentId(id);
        if (employeeCount > 0) {
            throw new BadRequestException("Cannot delete department '" + department.getName() + "' because it still has " + employeeCount + " assigned employee(s). Please reassign them first.");
        }

        departmentRepository.delete(department);
    }

    private DepartmentDTO mapToDTO(Department dept) {
        long count = employeeRepository.countByDepartmentId(dept.getId());
        return DepartmentDTO.builder()
                .id(dept.getId())
                .name(dept.getName())
                .description(dept.getDescription())
                .employeeCount(count)
                .createdAt(dept.getCreatedAt())
                .updatedAt(dept.getUpdatedAt())
                .build();
    }
}
