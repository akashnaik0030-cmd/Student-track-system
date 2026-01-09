package com.studenttrack.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Faculty Performance Report DTO
 * Shows faculty's teaching metrics, student outcomes, and engagement
 */
public class FacultyPerformanceReportDTO {
    private Long facultyId;
    private String facultyName;
    private String email;
    
    // Date range
    private LocalDate startDate;
    private LocalDate endDate;
    
    // Task Management Metrics
    private TaskManagementMetrics taskMetrics;
    
    // Student Engagement Metrics
    private StudentEngagementMetrics engagementMetrics;
    
    // Assessment & Grading Metrics
    private AssessmentMetrics assessmentMetrics;
    
    // Attendance Tracking Metrics
    private AttendanceTrackingMetrics attendanceMetrics;
    
    // Feedback & Communication Metrics
    private FeedbackMetrics feedbackMetrics;
    
    // Quiz Creation & Management
    private QuizMetrics quizMetrics;

    public static class TaskManagementMetrics {
        private int totalTasksCreated;
        private int totalTasksAssigned;
        private Map<String, Integer> tasksBySubject; // subject -> count
        private double averageCompletionRate; // percentage
        private List<TaskSummary> recentTasks;
        
        public TaskManagementMetrics() {}
        
        public int getTotalTasksCreated() { return totalTasksCreated; }
        public void setTotalTasksCreated(int totalTasksCreated) { this.totalTasksCreated = totalTasksCreated; }
        
        public int getTotalTasksAssigned() { return totalTasksAssigned; }
        public void setTotalTasksAssigned(int totalTasksAssigned) { this.totalTasksAssigned = totalTasksAssigned; }
        
        public Map<String, Integer> getTasksBySubject() { return tasksBySubject; }
        public void setTasksBySubject(Map<String, Integer> tasksBySubject) { this.tasksBySubject = tasksBySubject; }
        
        public double getAverageCompletionRate() { return averageCompletionRate; }
        public void setAverageCompletionRate(double averageCompletionRate) { this.averageCompletionRate = averageCompletionRate; }
        
        public List<TaskSummary> getRecentTasks() { return recentTasks; }
        public void setRecentTasks(List<TaskSummary> recentTasks) { this.recentTasks = recentTasks; }
    }
    
    public static class TaskSummary {
        private Long taskId;
        private String title;
        private String subject;
        private LocalDate dueDate;
        private int totalStudents;
        private int submittedCount;
        private int pendingCount;
        private double completionRate;
        
        public TaskSummary() {}
        
        public Long getTaskId() { return taskId; }
        public void setTaskId(Long taskId) { this.taskId = taskId; }
        
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        
        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
        
        public int getTotalStudents() { return totalStudents; }
        public void setTotalStudents(int totalStudents) { this.totalStudents = totalStudents; }
        
        public int getSubmittedCount() { return submittedCount; }
        public void setSubmittedCount(int submittedCount) { this.submittedCount = submittedCount; }
        
        public int getPendingCount() { return pendingCount; }
        public void setPendingCount(int pendingCount) { this.pendingCount = pendingCount; }
        
        public double getCompletionRate() { return completionRate; }
        public void setCompletionRate(double completionRate) { this.completionRate = completionRate; }
    }
    
    public static class StudentEngagementMetrics {
        private int totalStudentsTaught;
        private int activeStudents; // submitted at least once
        private double averageSubmissionTime; // days to submit
        private int lateSubmissions;
        private double studentResponseRate;
        
        public StudentEngagementMetrics() {}
        
        public int getTotalStudentsTaught() { return totalStudentsTaught; }
        public void setTotalStudentsTaught(int totalStudentsTaught) { this.totalStudentsTaught = totalStudentsTaught; }
        
        public int getActiveStudents() { return activeStudents; }
        public void setActiveStudents(int activeStudents) { this.activeStudents = activeStudents; }
        
        public double getAverageSubmissionTime() { return averageSubmissionTime; }
        public void setAverageSubmissionTime(double averageSubmissionTime) { this.averageSubmissionTime = averageSubmissionTime; }
        
        public int getLateSubmissions() { return lateSubmissions; }
        public void setLateSubmissions(int lateSubmissions) { this.lateSubmissions = lateSubmissions; }
        
        public double getStudentResponseRate() { return studentResponseRate; }
        public void setStudentResponseRate(double studentResponseRate) { this.studentResponseRate = studentResponseRate; }
    }
    
    public static class AssessmentMetrics {
        private int totalMarksEntered;
        private Map<String, Double> subjectAverages; // subject -> avg marks
        private Map<String, Integer> assessmentTypeCount; // UNIT_TEST_1 -> count
        private double overallClassAverage;
        
        public AssessmentMetrics() {}
        
        public int getTotalMarksEntered() { return totalMarksEntered; }
        public void setTotalMarksEntered(int totalMarksEntered) { this.totalMarksEntered = totalMarksEntered; }
        
        public Map<String, Double> getSubjectAverages() { return subjectAverages; }
        public void setSubjectAverages(Map<String, Double> subjectAverages) { this.subjectAverages = subjectAverages; }
        
        public Map<String, Integer> getAssessmentTypeCount() { return assessmentTypeCount; }
        public void setAssessmentTypeCount(Map<String, Integer> assessmentTypeCount) { this.assessmentTypeCount = assessmentTypeCount; }
        
        public double getOverallClassAverage() { return overallClassAverage; }
        public void setOverallClassAverage(double overallClassAverage) { this.overallClassAverage = overallClassAverage; }
    }
    
    public static class AttendanceTrackingMetrics {
        private int totalAttendanceRecords;
        private double overallAttendanceRate;
        private Map<String, Integer> statusDistribution; // PRESENT -> count
        private int studentsWithLowAttendance; // < 75%
        
        public AttendanceTrackingMetrics() {}
        
        public int getTotalAttendanceRecords() { return totalAttendanceRecords; }
        public void setTotalAttendanceRecords(int totalAttendanceRecords) { this.totalAttendanceRecords = totalAttendanceRecords; }
        
        public double getOverallAttendanceRate() { return overallAttendanceRate; }
        public void setOverallAttendanceRate(double overallAttendanceRate) { this.overallAttendanceRate = overallAttendanceRate; }
        
        public Map<String, Integer> getStatusDistribution() { return statusDistribution; }
        public void setStatusDistribution(Map<String, Integer> statusDistribution) { this.statusDistribution = statusDistribution; }
        
        public int getStudentsWithLowAttendance() { return studentsWithLowAttendance; }
        public void setStudentsWithLowAttendance(int studentsWithLowAttendance) { this.studentsWithLowAttendance = studentsWithLowAttendance; }
    }
    
    public static class FeedbackMetrics {
        private int totalFeedbackGiven;
        private double averageFeedbackPerStudent;
        private int studentsWithoutFeedback;
        
        public FeedbackMetrics() {}
        
        public int getTotalFeedbackGiven() { return totalFeedbackGiven; }
        public void setTotalFeedbackGiven(int totalFeedbackGiven) { this.totalFeedbackGiven = totalFeedbackGiven; }
        
        public double getAverageFeedbackPerStudent() { return averageFeedbackPerStudent; }
        public void setAverageFeedbackPerStudent(double averageFeedbackPerStudent) { this.averageFeedbackPerStudent = averageFeedbackPerStudent; }
        
        public int getStudentsWithoutFeedback() { return studentsWithoutFeedback; }
        public void setStudentsWithoutFeedback(int studentsWithoutFeedback) { this.studentsWithoutFeedback = studentsWithoutFeedback; }
    }
    
    public static class QuizMetrics {
        private int totalQuizzesCreated;
        private int totalQuizAttempts;
        private double averageQuizScore;
        private int studentsAttemptedQuizzes;
        
        public QuizMetrics() {}
        
        public int getTotalQuizzesCreated() { return totalQuizzesCreated; }
        public void setTotalQuizzesCreated(int totalQuizzesCreated) { this.totalQuizzesCreated = totalQuizzesCreated; }
        
        public int getTotalQuizAttempts() { return totalQuizAttempts; }
        public void setTotalQuizAttempts(int totalQuizAttempts) { this.totalQuizAttempts = totalQuizAttempts; }
        
        public double getAverageQuizScore() { return averageQuizScore; }
        public void setAverageQuizScore(double averageQuizScore) { this.averageQuizScore = averageQuizScore; }
        
        public int getStudentsAttemptedQuizzes() { return studentsAttemptedQuizzes; }
        public void setStudentsAttemptedQuizzes(int studentsAttemptedQuizzes) { this.studentsAttemptedQuizzes = studentsAttemptedQuizzes; }
    }
    
    // Main getters and setters
    public Long getFacultyId() { return facultyId; }
    public void setFacultyId(Long facultyId) { this.facultyId = facultyId; }
    
    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    
    public TaskManagementMetrics getTaskMetrics() { return taskMetrics; }
    public void setTaskMetrics(TaskManagementMetrics taskMetrics) { this.taskMetrics = taskMetrics; }
    
    public StudentEngagementMetrics getEngagementMetrics() { return engagementMetrics; }
    public void setEngagementMetrics(StudentEngagementMetrics engagementMetrics) { this.engagementMetrics = engagementMetrics; }
    
    public AssessmentMetrics getAssessmentMetrics() { return assessmentMetrics; }
    public void setAssessmentMetrics(AssessmentMetrics assessmentMetrics) { this.assessmentMetrics = assessmentMetrics; }
    
    public AttendanceTrackingMetrics getAttendanceMetrics() { return attendanceMetrics; }
    public void setAttendanceMetrics(AttendanceTrackingMetrics attendanceMetrics) { this.attendanceMetrics = attendanceMetrics; }
    
    public FeedbackMetrics getFeedbackMetrics() { return feedbackMetrics; }
    public void setFeedbackMetrics(FeedbackMetrics feedbackMetrics) { this.feedbackMetrics = feedbackMetrics; }
    
    public QuizMetrics getQuizMetrics() { return quizMetrics; }
    public void setQuizMetrics(QuizMetrics quizMetrics) { this.quizMetrics = quizMetrics; }
}
