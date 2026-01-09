package com.studenttrack.dto;

public class SubjectPerformanceDTO {
    private double totalMarks;
    private double maxMarks;
    private double averagePercentage;
    private int assessmentCount;

    public SubjectPerformanceDTO() {
        this.totalMarks = 0;
        this.maxMarks = 0;
        this.averagePercentage = 0;
        this.assessmentCount = 0;
    }

    public void updateStats(int marks, int maxMarks) {
        this.totalMarks += marks;
        this.maxMarks += maxMarks;
        this.assessmentCount++;
        this.averagePercentage = (this.totalMarks * 100.0) / this.maxMarks;
    }

    public double getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(double totalMarks) {
        this.totalMarks = totalMarks;
    }

    public double getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(double maxMarks) {
        this.maxMarks = maxMarks;
    }

    public double getAveragePercentage() {
        return averagePercentage;
    }

    public void setAveragePercentage(double averagePercentage) {
        this.averagePercentage = averagePercentage;
    }

    public int getAssessmentCount() {
        return assessmentCount;
    }

    public void setAssessmentCount(int assessmentCount) {
        this.assessmentCount = assessmentCount;
    }
}