package com.studenttrack.dto;

public class StudentQuizStatusDTO {
    private Long studentId;
    private String studentName;
    private String rollNumber;
    private Boolean hasAttempted;
    private Integer score;
    private Integer totalMarks;
    private Double percentage;
    private String submittedAt;
    private Long attemptId;
    
    public StudentQuizStatusDTO() {}
    
    public StudentQuizStatusDTO(Long studentId, String studentName, String rollNumber, 
                               Boolean hasAttempted, Integer score, Integer totalMarks, 
                               Double percentage, String submittedAt, Long attemptId) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.rollNumber = rollNumber;
        this.hasAttempted = hasAttempted;
        this.score = score;
        this.totalMarks = totalMarks;
        this.percentage = percentage;
        this.submittedAt = submittedAt;
        this.attemptId = attemptId;
    }
    
    // Getters and Setters
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
    
    public String getRollNumber() {
        return rollNumber;
    }
    
    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }
    
    public Boolean getHasAttempted() {
        return hasAttempted;
    }
    
    public void setHasAttempted(Boolean hasAttempted) {
        this.hasAttempted = hasAttempted;
    }
    
    public Integer getScore() {
        return score;
    }
    
    public void setScore(Integer score) {
        this.score = score;
    }
    
    public Integer getTotalMarks() {
        return totalMarks;
    }
    
    public void setTotalMarks(Integer totalMarks) {
        this.totalMarks = totalMarks;
    }
    
    public Double getPercentage() {
        return percentage;
    }
    
    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }
    
    public String getSubmittedAt() {
        return submittedAt;
    }
    
    public void setSubmittedAt(String submittedAt) {
        this.submittedAt = submittedAt;
    }
    
    public Long getAttemptId() {
        return attemptId;
    }
    
    public void setAttemptId(Long attemptId) {
        this.attemptId = attemptId;
    }
}
