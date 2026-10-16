package com.kohort.ems.dto;

import java.time.LocalDateTime;

public class EmployeeAuditLogDTO {
    private Long id;
    private Long employeeId;
    private String action;
    private String details;
    private String performedBy;
    private LocalDateTime timestamp;

    public EmployeeAuditLogDTO() {
    }

    public EmployeeAuditLogDTO(Long id, Long employeeId, String action, String details, String performedBy, LocalDateTime timestamp) {
        this.id = id;
        this.employeeId = employeeId;
        this.action = action;
        this.details = details;
        this.performedBy = performedBy;
        this.timestamp = timestamp;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Long employeeId;
        private String action;
        private String details;
        private String performedBy;
        private LocalDateTime timestamp;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder employeeId(Long employeeId) { this.employeeId = employeeId; return this; }
        public Builder action(String action) { this.action = action; return this; }
        public Builder details(String details) { this.details = details; return this; }
        public Builder performedBy(String performedBy) { this.performedBy = performedBy; return this; }
        public Builder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }

        public EmployeeAuditLogDTO build() {
            return new EmployeeAuditLogDTO(id, employeeId, action, details, performedBy, timestamp);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
