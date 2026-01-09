package com.studenttrack.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.ArrayList;
import java.util.List;

public class BulkMarksRequestDTO {
    @NotEmpty(message = "Entries cannot be empty")
    @Valid
    private List<BulkMarksEntryDTO> entries = new ArrayList<>();

    public List<BulkMarksEntryDTO> getEntries() {
        return entries;
    }

    public void setEntries(List<BulkMarksEntryDTO> entries) {
        this.entries = entries;
    }
}
