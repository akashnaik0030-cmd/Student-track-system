package com.studenttrack.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Comprehensive Student Report DTO
 * Contains attendance, marks, tasks, submissions, feedback, and quiz performance
 */
public class StudentDetailedReportDTO {
    private Long studentId;
    private String studentName;
    private String rollNumber;
    private String email;
    
    // Date range for report
    private LocalDate startDate;
    private LocalDate endDate;
    
    // Attendance Summary
    private AttendanceSummary attendanceSummary;
    
    // Academic Performance
    private AcademicPerformance academicPerformance;
    
    // Task & Submission Performance
    private TaskSubmissionPerformance taskPerformance;
    
    // Quiz Performance
    private QuizPerformance quizPerformance;
    
    // Feedback Summary
    private FeedbackSummary feedbackSummary;

    // Inner classes for structured data
    public static class AttendanceSummary {
        private int totalClasses;
        private int present;
        private int absent;
        private int late;
        private int excused;
        private double attendancePercentage;
        private Map<String, Integer> monthlyAttendance; // "2025-01": present_count
        
        public AttendanceSummary() {}
        
        // Getters and setters
        public int getTotalClasses() { return totalClasses; }
        public void setTotalClasses(int totalClasses) { this.totalClasses = totalClasses; }
        
        public int getPresent() { return present; }
        public void setPresent(int present) { this.present = present; }
        
        public int getAbsent() { return absent; }
        public void setAbsent(int absent) { this.absent = absent; }
        
        public int getLate() { return late; }
        public void setLate(int late) { this.late = late; }
        
        public int getExcused() { return excused; }
        public void setExcused(int excused) { this.excused = excused; }
        
        public double getAttendancePercentage() { return attendancePercentage; }
        public void setAttendancePercentage(double attendancePercentage) { this.attendancePercentage = attendancePercentage; }
        
        public Map<String, Integer> getMonthlyAttendance() { return monthlyAttendance; }
        public void setMonthlyAttendance(Map<String, Integer> monthlyAttendance) { this.monthlyAttendance = monthlyAttendance; }
    }
    
    public static class AcademicPerformance {
        private double overallAverage;
        private Map<String, SubjectMarks> subjectWiseMarks; // subject -> marks
        private List<AssessmentDetail> assessments;
        
        public AcademicPerformance() {}
        
        public double getOverallAverage() { return overallAverage; }
        public void setOverallAverage(double overallAverage) { this.overallAverage = overallAverage; }
        
        public Map<String, SubjectMarks> getSubjectWiseMarks() { return subjectWiseMarks; }
        public void setSubjectWiseMarks(Map<String, SubjectMarks> subjectWiseMarks) { this.subjectWiseMarks = subjectWiseMarks; }
        
        public List<AssessmentDetail> getAssessments() { return assessments; }
        public void setAssessments(List<AssessmentDetail> assessments) { this.assessments = assessments; }
    }
    
    public static class SubjectMarks {
        private String subject;
        private double average;
        private double highest;
        private double lowest;
        
        public SubjectMarks() {}
        
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        
        public double getAverage() { return average; }
        public void setAverage(double average) { this.average = average; }
        
        public double getHighest() { return highest; }
        public void setHighest(double highest) { this.highest = highest; }
        
        public double getLowest() { return lowest; }
        public void setLowest(double lowest) { this.lowest = lowest; }
    }
    
    public static class AssessmentDetail {
        private String assessmentType;
        private String subject;
        private double marksObtained;
        private double totalMarks;
        private double percentage;
        private LocalDate date;
        
        public AssessmentDetail() {}
        
        public String getAssessmentType() { return assessmentType; }
        public void setAssessmentType(String assessmentType) { this.assessmentType = assessmentType; }
        
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        
        public double getMarksObtained() { return marksObtained; }
        public void setMarksObtained(double marksObtained) { this.marksObtained = marksObtained; }
        
        public double getTotalMarks() { return totalMarks; }
        public void setTotalMarks(double totalMarks) { this.totalMarks = totalMarks; }
        
        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }
        
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
    }
    
    public static class TaskSubmissionPerformance {
        private int totalTasksAssigned;
        private int completedTasks;
        private int pendingTasks;
        private int lateSubmissions;
        private double completionRate;
        private double averageTimeToSubmit; // in days
        
        public TaskSubmissionPerformance() {}
        
        public int getTotalTasksAssigned() { return totalTasksAssigned; }
        public void setTotalTasksAssigned(int totalTasksAssigned) { this.totalTasksAssigned = totalTasksAssigned; }
        
        public int getCompletedTasks() { return completedTasks; }
        public void setCompletedTasks(int completedTasks) { this.completedTasks = completedTasks; }
        
        public int getPendingTasks() { return pendingTasks; }
        public void setPendingTasks(int pendingTasks) { this.pendingTasks = pendingTasks; }
        
        public int getLateSubmissions() { return lateSubmissions; }
        public void setLateSubmissions(int lateSubmissions) { this.lateSubmissions = lateSubmissions; }
        
        public double getCompletionRate() { return completionRate; }
        public void setCompletionRate(double completionRate) { this.completionRate = completionRate; }
        
        public double getAverageTimeToSubmit() { return averageTimeToSubmit; }
        public void setAverageTimeToSubmit(double averageTimeToSubmit) { this.averageTimeToSubmit = averageTimeToSubmit; }
    }
    
    public static class QuizPerformance {
        private int totalQuizzes;
        private int attemptedQuizzes;
        private double averageScore;
        private double highestScore;
        private double lowestScore;
        
        public QuizPerformance() {}
        
        public int getTotalQuizzes() { return totalQuizzes; }
        public void setTotalQuizzes(int totalQuizzes) { this.totalQuizzes = totalQuizzes; }
        
        public int getAttemptedQuizzes() { return attemptedQuizzes; }
        public void setAttemptedQuizzes(int attemptedQuizzes) { this.attemptedQuizzes = attemptedQuizzes; }
        
        public double getAverageScore() { return averageScore; }
        public void setAverageScore(double averageScore) { this.averageScore = averageScore; }
        
        public double getHighestScore() { return highestScore; }
        public void setHighestScore(double highestScore) { this.highestScore = highestScore; }
        
        public double getLowestScore() { return lowestScore; }
        public void setLowestScore(double lowestScore) { this.lowestScore = lowestScore; }
    }
    
    public static class FeedbackSummary {
        private int totalFeedbackReceived;
        private String latestFeedback;
        private LocalDate latestFeedbackDate;
        
        public FeedbackSummary() {}
        
        public int getTotalFeedbackReceived() { return totalFeedbackReceived; }
        public void setTotalFeedbackReceived(int totalFeedbackReceived) { this.totalFeedbackReceived = totalFeedbackReceived; }
        
        public String getLatestFeedback() { return latestFeedback; }
        public void setLatestFeedback(String latestFeedback) { this.latestFeedback = latestFeedback; }
        
        public LocalDate getLatestFeedbackDate() { return latestFeedbackDate; }
        public void setLatestFeedbackDate(LocalDate latestFeedbackDate) { this.latestFeedbackDate = latestFeedbackDate; }
    }
    
    // Main class getters and setters
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    
    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    
    public AttendanceSummary getAttendanceSummary() { return attendanceSummary; }
    public void setAttendanceSummary(AttendanceSummary attendanceSummary) { this.attendanceSummary = attendanceSummary; }
    
    public AcademicPerformance getAcademicPerformance() { return academicPerformance; }
    public void setAcademicPerformance(AcademicPerformance academicPerformance) { this.academicPerformance = academicPerformance; }
    
    public TaskSubmissionPerformance getTaskPerformance() { return taskPerformance; }
    public void setTaskPerformance(TaskSubmissionPerformance taskPerformance) { this.taskPerformance = taskPerformance; }
    
    public QuizPerformance getQuizPerformance() { return quizPerformance; }
    public void setQuizPerformance(QuizPerformance quizPerformance) { this.quizPerformance = quizPerformance; }
    
    public FeedbackSummary getFeedbackSummary() { return feedbackSummary; }
    public void setFeedbackSummary(FeedbackSummary feedbackSummary) { this.feedbackSummary = feedbackSummary; }
}
