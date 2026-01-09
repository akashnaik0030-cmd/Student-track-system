package com.studenttrack.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

public class TaskDTO {

    private Long id;
    private String title;
    private String description;
    private String subject;
    private String status; // Enum as String
    private Long assignedById; // Only the IDs instead of full User objects
    private String assignedByFullName; // Full name of the faculty who assigned the task
    private Long assignedToId;
    private String assignedToFullName; // Full name of the student to whom task is assigned
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dueDate;

    // Constructors
    public TaskDTO() {}

    public TaskDTO(Long id, String title, String description, String status,
                   Long assignedById, Long assignedToId,
                   LocalDateTime createdAt, LocalDateTime dueDate) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.assignedById = assignedById;
        this.assignedToId = assignedToId;
        this.createdAt = createdAt;
        this.dueDate = dueDate;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getAssignedById() { return assignedById; }
    public void setAssignedById(Long assignedById) { this.assignedById = assignedById; }

    public String getAssignedByFullName() { return assignedByFullName; }
    public void setAssignedByFullName(String assignedByFullName) { this.assignedByFullName = assignedByFullName; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public String getAssignedToFullName() { return assignedToFullName; }
    public void setAssignedToFullName(String assignedToFullName) { this.assignedToFullName = assignedToFullName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
}
