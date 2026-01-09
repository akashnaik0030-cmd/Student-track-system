package com.studenttrack.dto;

import java.time.LocalDateTime;
import java.util.List;

public class SubmissionReportDTO {
    private Long facultyId;
    private String facultyName;
    private String subject;
    private Long taskId;
    private String taskTitle;
    private LocalDateTime taskDueDate;
    private Integer totalStudents;
    private Integer submittedCount;
    private Integer pendingCount;
    private Integer onTimeCount;
    private Integer lateCount;
    private Double submissionRate;
    private List<StudentSubmissionSummary> studentSubmissions;

    public static class StudentSubmissionSummary {
        private Long studentId;
        private String studentName;
        private String rollNumber;
        private String status;
        private String timeliness;
        private LocalDateTime submittedAt;
        private String facultyRemark;
        private LocalDateTime markedCompleteAt;

        // Constructors
        public StudentSubmissionSummary() {}

        public StudentSubmissionSummary(Long studentId, String studentName, String rollNumber, 
                                       String status, String timeliness, LocalDateTime submittedAt,
                                       String facultyRemark, LocalDateTime markedCompleteAt) {
            this.studentId = studentId;
            this.studentName = studentName;
            this.rollNumber = rollNumber;
            this.status = status;
            this.timeliness = timeliness;
            this.submittedAt = submittedAt;
            this.facultyRemark = facultyRemark;
            this.markedCompleteAt = markedCompleteAt;
        }

        // Getters and Setters
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        
        public String getRollNumber() { return rollNumber; }
        public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getTimeliness() { return timeliness; }
        public void setTimeliness(String timeliness) { this.timeliness = timeliness; }
        
        public LocalDateTime getSubmittedAt() { return submittedAt; }
        public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
        
        public String getFacultyRemark() { return facultyRemark; }
        public void setFacultyRemark(String facultyRemark) { this.facultyRemark = facultyRemark; }
        
        public LocalDateTime getMarkedCompleteAt() { return markedCompleteAt; }
        public void setMarkedCompleteAt(LocalDateTime markedCompleteAt) { this.markedCompleteAt = markedCompleteAt; }
    }

    // Constructors
    public SubmissionReportDTO() {}

    // Getters and Setters
    public Long getFacultyId() { return facultyId; }
    public void setFacultyId(Long facultyId) { this.facultyId = facultyId; }
    
    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    
    public String getTaskTitle() { return taskTitle; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }
    
    public LocalDateTime getTaskDueDate() { return taskDueDate; }
    public void setTaskDueDate(LocalDateTime taskDueDate) { this.taskDueDate = taskDueDate; }
    
    public Integer getTotalStudents() { return totalStudents; }
    public void setTotalStudents(Integer totalStudents) { this.totalStudents = totalStudents; }
    
    public Integer getSubmittedCount() { return submittedCount; }
    public void setSubmittedCount(Integer submittedCount) { this.submittedCount = submittedCount; }
    
    public Integer getPendingCount() { return pendingCount; }
    public void setPendingCount(Integer pendingCount) { this.pendingCount = pendingCount; }
    
    public Integer getOnTimeCount() { return onTimeCount; }
    public void setOnTimeCount(Integer onTimeCount) { this.onTimeCount = onTimeCount; }
    
    public Integer getLateCount() { return lateCount; }
    public void setLateCount(Integer lateCount) { this.lateCount = lateCount; }
    
    public Double getSubmissionRate() { return submissionRate; }
    public void setSubmissionRate(Double submissionRate) { this.submissionRate = submissionRate; }
    
    public List<StudentSubmissionSummary> getStudentSubmissions() { return studentSubmissions; }
    public void setStudentSubmissions(List<StudentSubmissionSummary> studentSubmissions) { this.studentSubmissions = studentSubmissions; }
}
