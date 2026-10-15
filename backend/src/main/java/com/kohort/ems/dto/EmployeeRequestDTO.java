package com.kohort.ems.dto;

import com.kohort.ems.model.EmploymentStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public class EmployeeRequestDTO {

    @NotBlank(message = "Employee ID is required")
    @Pattern(regexp = "^[A-Za-z0-9_-]{2,30}$", message = "Employee ID must be 2-30 characters with letters, numbers, hyphens or underscores only")
    private String employeeId;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters")
    private String fullName;

    @NotBlank(message = "Email address is required")
    @Email(message = "Email address must be well-formed")
    @Size(max = 255, message = "Email address must not exceed 255 characters")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[+0-9 ()-]{7,25}$", message = "Phone number must be a valid format (7-25 digits/symbols)")
    private String phoneNumber;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    @NotBlank(message = "Designation is required")
    @Size(min = 2, max = 100, message = "Designation must be between 2 and 100 characters")
    private String designation;

    @NotNull(message = "Date of joining is required")
    @PastOrPresent(message = "Date of joining cannot be in the future")
    private LocalDate dateOfJoining;

    @NotNull(message = "Salary is required")
    @DecimalMin(value = "0.01", message = "Salary must be strictly greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Salary can have up to 10 integer digits and 2 decimals")
    private BigDecimal salary;

    @NotNull(message = "Employment status is required (Active or Inactive)")
    private EmploymentStatus status;

    public EmployeeRequestDTO() {
    }

    public EmployeeRequestDTO(String employeeId, String fullName, String email, String phoneNumber,
                              Long departmentId, String designation, LocalDate dateOfJoining,
                              BigDecimal salary, EmploymentStatus status) {
        this.employeeId = employeeId;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.departmentId = departmentId;
        this.designation = designation;
        this.dateOfJoining = dateOfJoining;
        this.salary = salary;
        this.status = status;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String employeeId;
        private String fullName;
        private String email;
        private String phoneNumber;
        private Long departmentId;
        private String designation;
        private LocalDate dateOfJoining;
        private BigDecimal salary;
        private EmploymentStatus status;

        public Builder employeeId(String employeeId) { this.employeeId = employeeId; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder phoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; return this; }
        public Builder departmentId(Long departmentId) { this.departmentId = departmentId; return this; }
        public Builder designation(String designation) { this.designation = designation; return this; }
        public Builder dateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; return this; }
        public Builder salary(BigDecimal salary) { this.salary = salary; return this; }
        public Builder status(EmploymentStatus status) { this.status = status; return this; }

        public EmployeeRequestDTO build() {
            return new EmployeeRequestDTO(employeeId, fullName, email, phoneNumber, departmentId, designation, dateOfJoining, salary, status);
        }
    }

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

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public LocalDate getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; }

    public BigDecimal getSalary() { return salary; }
    public void setSalary(BigDecimal salary) { this.salary = salary; }

    public EmploymentStatus getStatus() { return status; }
    public void setStatus(EmploymentStatus status) { this.status = status; }
}
