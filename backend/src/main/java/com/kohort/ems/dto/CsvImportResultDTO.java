package com.kohort.ems.dto;

import java.util.List;

public class CsvImportResultDTO {
    private int totalProcessed;
    private int successCount;
    private int failureCount;
    private List<String> errors;

    public CsvImportResultDTO() {
    }

    public CsvImportResultDTO(int totalProcessed, int successCount, int failureCount, List<String> errors) {
        this.totalProcessed = totalProcessed;
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.errors = errors;
    }

    public int getTotalProcessed() { return totalProcessed; }
    public void setTotalProcessed(int totalProcessed) { this.totalProcessed = totalProcessed; }

    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }

    public int getFailureCount() { return failureCount; }
    public void setFailureCount(int failureCount) { this.failureCount = failureCount; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
