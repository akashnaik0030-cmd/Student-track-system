package com.studenttrack.dto;

import java.util.ArrayList;
import java.util.List;

public class BulkMarksResponseDTO {
    private int savedCount;
    private int failedCount;
    private List<String> errors = new ArrayList<>();

    public int getSavedCount() {
        return savedCount;
    }

    public void setSavedCount(int savedCount) {
        this.savedCount = savedCount;
    }

    public int getFailedCount() {
        return failedCount;
    }

    public void setFailedCount(int failedCount) {
        this.failedCount = failedCount;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors;
    }

    public void addError(String error) {
        this.errors.add(error);
    }
}
