package com.studenttrack.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "classes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ClassEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String name;
    
    @Column(length = 50)
    private String division;
    
    @Column(length = 20)
    private String year;
    
    @Column(length = 100)
    private String department;
    
    @Column(name = "academic_year", length = 20)
    private String academicYear;
    
    @Column(columnDefinition = "TEXT")
    private String subjects; // Comma-separated list of subjects
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Relationships
    @OneToMany(mappedBy = "classEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("classEntity")
    private List<User> students = new ArrayList<>();
    
    @OneToMany(mappedBy = "classEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("classEntity")
    private List<Task> tasks = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Helper method to get full display name
    public String getFullName() {
        return String.format("%s - %s (%s)", name, division, academicYear);
    }

    // Explicit getter for id to avoid issues when Lombok isn't processed
    public Long getId() {
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDivision() {
        return this.division;
    }

    public void setDivision(String division) {
        this.division = division;
    }

    public String getYear() {
        return this.year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getDepartment() {
        return this.department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getAcademicYear() {
        return this.academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public Boolean getIsActive() {
        return this.isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return this.createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return this.updatedAt;
    }

    public List<User> getStudents() {
        return this.students;
    }

    public void setStudents(List<User> students) {
        this.students = students;
    }

    public List<Task> getTasks() {
        return this.tasks;
    }

    public void setTasks(List<Task> tasks) {
        this.tasks = tasks;
    }
    
    // Helper method to count active students
    public int getActiveStudentCount() {
        return students != null ? (int) students.stream()
                .filter(user -> user.getRoles().stream()
                        .anyMatch(role -> role.getName().equals("ROLE_STUDENT")))
                .count() : 0;
    }
}
