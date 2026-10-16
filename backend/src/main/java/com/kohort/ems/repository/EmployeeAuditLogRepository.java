package com.kohort.ems.repository;

import com.kohort.ems.model.EmployeeAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface EmployeeAuditLogRepository extends JpaRepository<EmployeeAuditLog, Long> {
    List<EmployeeAuditLog> findByEmployeeIdOrderByTimestampDesc(Long employeeId);

    @Modifying
    @Transactional
    void deleteByEmployeeId(Long employeeId);
}
