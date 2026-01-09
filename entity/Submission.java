package com.studenttrack.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 2000)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "status")
    @Size(max = 20)
    private String status; // PENDING, COMPLETED

    @Column(name = "submission_timeliness")
    @Size(max = 20)
    private String submissionTimeliness; // ON_TIME, LATE

    @Column(name = "faculty_remark", length = 1000)
    private String facultyRemark;

    @Column(name = "marked_complete_at")
    private LocalDateTime markedCompleteAt;

    public Submission() {}

    public Submission(String content, Task task, User student) {
        this.content = content;
        this.task = task;
        this.student = student;
        this.submittedAt = LocalDateTime.now();
        this.status = "PENDING";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Task getTask() {
        return task;
    }

    public void setTask(Task task) {
        this.task = task;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSubmissionTimeliness() {
        return submissionTimeliness;
    }

    public void setSubmissionTimeliness(String submissionTimeliness) {
        this.submissionTimeliness = submissionTimeliness;
    }

    public String getFacultyRemark() {
        return facultyRemark;
    }

    public void setFacultyRemark(String facultyRemark) {
        this.facultyRemark = facultyRemark;
    }

    public LocalDateTime getMarkedCompleteAt() {
        return markedCompleteAt;
    }

    public void setMarkedCompleteAt(LocalDateTime markedCompleteAt) {
        this.markedCompleteAt = markedCompleteAt;
    }
}