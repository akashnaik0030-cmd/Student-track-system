package com.studenttrack.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "faculty_class_subjects", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"faculty_id", "class_id", "subject"}))
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FacultyClassSubject {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private User faculty;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;
    
    @Column(nullable = false, length = 100)
    private String subject;
    
    @Column(name = "assigned_by_id")
    private Long assignedById;
    
    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getFaculty() {
        return faculty;
    }
    
    public void setFaculty(User faculty) {
        this.faculty = faculty;
    }
    
    public ClassEntity getClassEntity() {
        return classEntity;
    }
    
    public void setClassEntity(ClassEntity classEntity) {
        this.classEntity = classEntity;
    }
    
    public String getSubject() {
        return subject;
    }
    
    public void setSubject(String subject) {
        this.subject = subject;
    }
    
    public Long getAssignedById() {
        return assignedById;
    }
    
    public void setAssignedById(Long assignedById) {
        this.assignedById = assignedById;
    }
    
    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }
    
    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
