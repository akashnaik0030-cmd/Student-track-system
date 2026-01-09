package com.studenttrack.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_types")
public class AssessmentType {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String name;
    
    @Column(length = 255)
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "max_marks")
    private Integer maxMarks;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    // Constructors
    public AssessmentType() {
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
    }
    
    public AssessmentType(String name, String description, User createdBy, Integer maxMarks) {
        this.name = name;
        this.description = description;
        this.createdBy = createdBy;
        this.maxMarks = maxMarks;
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public User getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public Integer getMaxMarks() {
        return maxMarks;
    }
    
    public void setMaxMarks(Integer maxMarks) {
        this.maxMarks = maxMarks;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}