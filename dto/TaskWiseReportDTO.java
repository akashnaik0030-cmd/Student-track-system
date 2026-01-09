package com.studenttrack.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Task-wise Report DTO
 * Shows detailed metrics for specific tasks including submissions and student performance
 * Faculty can see their own tasks, HOD can see all tasks faculty-wise
 */
public class TaskWiseReportDTO {
    private Long taskId;
    private String taskTitle;
    private String subject;
    private String description;
    private LocalDate startDate;
    private LocalDate dueDate;
    private LocalDate createdDate;
    
    // Faculty information
    private Long facultyId;
    private String facultyName;
    
    // Overall Task Metrics
    private TaskMetrics metrics;
    
    // Student-wise submission details
    private List<StudentSubmissionDetail> studentDetails;

    public static class TaskMetrics {
        private int totalStudentsAssigned;
        private int submittedCount;
        private int pendingCount;
        private int completedCount; // marked complete by faculty
        private double completionRate; // percentage
        private double submissionRate; // percentage
        private int lateSubmissions;
        private double averageSubmissionTime; // days from assignment to submission
        private int submissionsWithFiles;
        
        public TaskMetrics() {}
        
        public int getTotalStudentsAssigned() { return totalStudentsAssigned; }
        public void setTotalStudentsAssigned(int totalStudentsAssigned) { this.totalStudentsAssigned = totalStudentsAssigned; }
        
        public int getSubmittedCount() { return submittedCount; }
        public void setSubmittedCount(int submittedCount) { this.submittedCount = submittedCount; }
        
        public int getPendingCount() { return pendingCount; }
        public void setPendingCount(int pendingCount) { this.pendingCount = pendingCount; }
        
        public int getCompletedCount() { return completedCount; }
        public void setCompletedCount(int completedCount) { this.completedCount = completedCount; }
        
        public double getCompletionRate() { return completionRate; }
        public void setCompletionRate(double completionRate) { this.completionRate = completionRate; }
        
        public double getSubmissionRate() { return submissionRate; }
        public void setSubmissionRate(double submissionRate) { this.submissionRate = submissionRate; }
        
        public int getLateSubmissions() { return lateSubmissions; }
        public void setLateSubmissions(int lateSubmissions) { this.lateSubmissions = lateSubmissions; }
        
        public double getAverageSubmissionTime() { return averageSubmissionTime; }
        public void setAverageSubmissionTime(double averageSubmissionTime) { this.averageSubmissionTime = averageSubmissionTime; }
        
        public int getSubmissionsWithFiles() { return submissionsWithFiles; }
        public void setSubmissionsWithFiles(int submissionsWithFiles) { this.submissionsWithFiles = submissionsWithFiles; }
    }
    
    public static class StudentSubmissionDetail {
        private Long studentId;
        private String studentName;
        private String rollNumber;
        private String submissionStatus; // PENDING, SUBMITTED, COMPLETED
        private LocalDate submittedDate;
        private String content;
        private boolean hasFile;
        private String fileName;
        private boolean isLate;
        private int daysToSubmit; // time taken from assignment to submission
        private String facultyRemark;
        private LocalDate markedCompleteAt;
        
        public StudentSubmissionDetail() {}
        
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        
        public String getRollNumber() { return rollNumber; }
        public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
        
        public String getSubmissionStatus() { return submissionStatus; }
        public void setSubmissionStatus(String submissionStatus) { this.submissionStatus = submissionStatus; }
        
        public LocalDate getSubmittedDate() { return submittedDate; }
        public void setSubmittedDate(LocalDate submittedDate) { this.submittedDate = submittedDate; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public boolean isHasFile() { return hasFile; }
        public void setHasFile(boolean hasFile) { this.hasFile = hasFile; }
        
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        
        public boolean isLate() { return isLate; }
        public void setLate(boolean late) { isLate = late; }
        
        public int getDaysToSubmit() { return daysToSubmit; }
        public void setDaysToSubmit(int daysToSubmit) { this.daysToSubmit = daysToSubmit; }
        
        public String getFacultyRemark() { return facultyRemark; }
        public void setFacultyRemark(String facultyRemark) { this.facultyRemark = facultyRemark; }
        
        public LocalDate getMarkedCompleteAt() { return markedCompleteAt; }
        public void setMarkedCompleteAt(LocalDate markedCompleteAt) { this.markedCompleteAt = markedCompleteAt; }
    }
    
    // Main getters and setters
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    
    public String getTaskTitle() { return taskTitle; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    
    public LocalDate getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDate createdDate) { this.createdDate = createdDate; }
    
    public Long getFacultyId() { return facultyId; }
    public void setFacultyId(Long facultyId) { this.facultyId = facultyId; }
    
    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }
    
    public TaskMetrics getMetrics() { return metrics; }
    public void setMetrics(TaskMetrics metrics) { this.metrics = metrics; }
    
    public List<StudentSubmissionDetail> getStudentDetails() { return studentDetails; }
    public void setStudentDetails(List<StudentSubmissionDetail> studentDetails) { this.studentDetails = studentDetails; }
}
