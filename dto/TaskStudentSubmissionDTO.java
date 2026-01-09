package com.studenttrack.dto;

import java.time.LocalDateTime;

public class TaskStudentSubmissionDTO {
    private Long studentId;
    private String studentName;
    private String studentRollNumber;
    private Long taskId;
    private String taskTitle;
    private Boolean hasSubmission;
    private Long submissionId;
    private String submissionContent;
    private LocalDateTime submittedAt;
    private String fileName;
    private Long fileSize;
    private String submissionStatus;
    private String facultyRemark;

    public TaskStudentSubmissionDTO() {}

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentRollNumber() {
        return studentRollNumber;
    }

    public void setStudentRollNumber(String studentRollNumber) {
        this.studentRollNumber = studentRollNumber;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public String getTaskTitle() {
        return taskTitle;
    }

    public void setTaskTitle(String taskTitle) {
        this.taskTitle = taskTitle;
    }

    public Boolean getHasSubmission() {
        return hasSubmission;
    }

    public void setHasSubmission(Boolean hasSubmission) {
        this.hasSubmission = hasSubmission;
    }

    public Long getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(Long submissionId) {
        this.submissionId = submissionId;
    }

    public String getSubmissionContent() {
        return submissionContent;
    }

    public void setSubmissionContent(String submissionContent) {
        this.submissionContent = submissionContent;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
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

    public String getSubmissionStatus() {
        return submissionStatus;
    }

    public void setSubmissionStatus(String submissionStatus) {
        this.submissionStatus = submissionStatus;
    }

    public String getFacultyRemark() {
        return facultyRemark;
    }

    public void setFacultyRemark(String facultyRemark) {
        this.facultyRemark = facultyRemark;
    }
}

