package com.studenttrack.dto;

import java.time.LocalDateTime;

public class SubmissionOverviewDTO {
    private Long submissionId;
    private Long taskId;
    private String taskTitle;
    private String taskSubject;
    private Long facultyId;
    private String facultyName;
    private Long studentId;
    private String studentName;
    private String studentRollNumber;
    private String submissionContent;
    private LocalDateTime submittedAt;
    private String fileName;
    private Long fileSize;
    private String status;
    private String submissionTimeliness;
    private String facultyRemark;
    private LocalDateTime markedCompleteAt;

    public SubmissionOverviewDTO() {}

    public Long getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(Long submissionId) {
        this.submissionId = submissionId;
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

    public String getTaskSubject() {
        return taskSubject;
    }

    public void setTaskSubject(String taskSubject) {
        this.taskSubject = taskSubject;
    }

    public Long getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(Long facultyId) {
        this.facultyId = facultyId;
    }

    public String getFacultyName() {
        return facultyName;
    }

    public void setFacultyName(String facultyName) {
        this.facultyName = facultyName;
    }

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

    public String getStudentRollNumber() {
        return studentRollNumber;
    }

    public void setStudentRollNumber(String studentRollNumber) {
        this.studentRollNumber = studentRollNumber;
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


