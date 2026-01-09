package com.studenttrack.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class AggregatedTaskDTO {
    private Long id;
    private String title;
    private String description;
    private String subject;
    private LocalDateTime dueDate;
    private Long assignedById;
    private String assignedByFullName;
    private Integer studentCount;
    private Map<String, Integer> statusCounts; // PENDING/IN_PROGRESS/COMPLETED

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    public Long getAssignedById() { return assignedById; }
    public void setAssignedById(Long assignedById) { this.assignedById = assignedById; }
    public String getAssignedByFullName() { return assignedByFullName; }
    public void setAssignedByFullName(String assignedByFullName) { this.assignedByFullName = assignedByFullName; }
    public Integer getStudentCount() { return studentCount; }
    public void setStudentCount(Integer studentCount) { this.studentCount = studentCount; }
    public Map<String, Integer> getStatusCounts() { return statusCounts; }
    public void setStatusCounts(Map<String, Integer> statusCounts) { this.statusCounts = statusCounts; }
}
