package com.studenttrack.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Entity
@Table(name = "attendance", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"date", "student_id", "faculty_id"})
})
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "date")
    private LocalDate date;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id")
    private User faculty;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private AttendanceStatus status;

    @Column(name = "remarks", length = 500)
    private String remarks;

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    public Attendance() {}

    public Attendance(LocalDate date, User student, User faculty, AttendanceStatus status) {
        this.date = date;
        this.student = student;
        this.faculty = faculty;
        this.status = status;
        this.createdAt = java.time.LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public User getFaculty() {
        return faculty;
    }

    public void setFaculty(User faculty) {
        this.faculty = faculty;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}


