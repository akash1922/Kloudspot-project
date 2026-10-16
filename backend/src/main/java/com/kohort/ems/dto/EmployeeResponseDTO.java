package com.kohort.ems.dto;

import com.kohort.ems.model.EmploymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class EmployeeResponseDTO {
    private Long id;
    private String employeeId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private Long departmentId;
    private String departmentName;
    private String designation;
    private LocalDate dateOfJoining;
    private BigDecimal salary;
    private EmploymentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean archived;
    private LocalDateTime archivedAt;
    private Long ttlDaysRemaining;

    public EmployeeResponseDTO() {
    }

    public EmployeeResponseDTO(Long id, String employeeId, String fullName, String email, String phoneNumber,
                               Long departmentId, String departmentName, String designation,
                               LocalDate dateOfJoining, BigDecimal salary, EmploymentStatus status,
                               LocalDateTime createdAt, LocalDateTime updatedAt,
                               boolean archived, LocalDateTime archivedAt, Long ttlDaysRemaining) {
        this.id = id;
        this.employeeId = employeeId;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.designation = designation;
        this.dateOfJoining = dateOfJoining;
        this.salary = salary;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.archived = archived;
        this.archivedAt = archivedAt;
        this.ttlDaysRemaining = ttlDaysRemaining;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String employeeId;
        private String fullName;
        private String email;
        private String phoneNumber;
        private Long departmentId;
        private String departmentName;
        private String designation;
        private LocalDate dateOfJoining;
        private BigDecimal salary;
        private EmploymentStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private boolean archived;
        private LocalDateTime archivedAt;
        private Long ttlDaysRemaining;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder employeeId(String employeeId) { this.employeeId = employeeId; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder phoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; return this; }
        public Builder departmentId(Long departmentId) { this.departmentId = departmentId; return this; }
        public Builder departmentName(String departmentName) { this.departmentName = departmentName; return this; }
        public Builder designation(String designation) { this.designation = designation; return this; }
        public Builder dateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; return this; }
        public Builder salary(BigDecimal salary) { this.salary = salary; return this; }
        public Builder status(EmploymentStatus status) { this.status = status; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder archived(boolean archived) { this.archived = archived; return this; }
        public Builder archivedAt(LocalDateTime archivedAt) { this.archivedAt = archivedAt; return this; }
        public Builder ttlDaysRemaining(Long ttlDaysRemaining) { this.ttlDaysRemaining = ttlDaysRemaining; return this; }

        public EmployeeResponseDTO build() {
            return new EmployeeResponseDTO(id, employeeId, fullName, email, phoneNumber, departmentId, departmentName, designation, dateOfJoining, salary, status, createdAt, updatedAt, archived, archivedAt, ttlDaysRemaining);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public LocalDate getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; }

    public BigDecimal getSalary() { return salary; }
    public void setSalary(BigDecimal salary) { this.salary = salary; }

    public EmploymentStatus getStatus() { return status; }
    public void setStatus(EmploymentStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public LocalDateTime getArchivedAt() { return archivedAt; }
    public void setArchivedAt(LocalDateTime archivedAt) { this.archivedAt = archivedAt; }

    public Long getTtlDaysRemaining() { return ttlDaysRemaining; }
    public void setTtlDaysRemaining(Long ttlDaysRemaining) { this.ttlDaysRemaining = ttlDaysRemaining; }
}
