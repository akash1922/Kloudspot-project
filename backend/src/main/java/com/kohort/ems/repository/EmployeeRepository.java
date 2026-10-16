package com.kohort.ems.repository;

import com.kohort.ems.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {
    Optional<Employee> findByEmployeeId(String employeeId);
    Optional<Employee> findByEmail(String email);
    boolean existsByEmployeeId(String employeeId);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByEmployeeIdAndIdNot(String employeeId, Long id);
    long countByDepartmentId(Long departmentId);
    long countByDepartmentIdAndArchivedFalse(Long departmentId);
    List<Employee> findByArchivedTrueOrderByArchivedAtDesc();
    List<Employee> findByArchivedTrueAndArchivedAtBefore(LocalDateTime cutoff);
}
