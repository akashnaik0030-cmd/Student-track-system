package com.studenttrack.dto;

import jakarta.validation.constraints.NotBlank;

public class NoteRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String content;

    private Long assignedToId;

    private Boolean isPublic = false;
    
    private java.util.List<Long> assignedToIds;
    
    private String fileName;
    private Long fileSize;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getAssignedToId() {
        return assignedToId;
    }

    public void setAssignedToId(Long assignedToId) {
        this.assignedToId = assignedToId;
    }

    public Boolean getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }
    
    public java.util.List<Long> getAssignedToIds() {
        return assignedToIds;
    }
    
    public void setAssignedToIds(java.util.List<Long> assignedToIds) {
        this.assignedToIds = assignedToIds;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
}

