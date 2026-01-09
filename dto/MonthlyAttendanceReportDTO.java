package com.studenttrack.dto;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

public class MonthlyAttendanceReportDTO {
    private Long facultyId;
    private String facultyName;
    private String subject;
    private YearMonth month;
    private Integer totalClasses;
    private Integer totalPresent;
    private Integer totalAbsent;
    private Integer totalLate;
    private Integer totalExcused;
    private Double attendancePercentage;
    private List<StudentAttendanceSummary> studentSummaries;

    public static class StudentAttendanceSummary {
        private Long studentId;
        private String studentName;
        private String rollNumber;
        private Integer present;
        private Integer absent;
        private Integer late;
        private Integer excused;
        private Double percentage;
        private Map<Integer, String> dailyAttendance; // Day of month -> Status

        // Constructors
        public StudentAttendanceSummary() {}

        public StudentAttendanceSummary(Long studentId, String studentName, String rollNumber, 
                                       Integer present, Integer absent, Integer late, Integer excused, Double percentage) {
            this.studentId = studentId;
            this.studentName = studentName;
            this.rollNumber = rollNumber;
            this.present = present;
            this.absent = absent;
            this.late = late;
            this.excused = excused;
            this.percentage = percentage;
        }

        // Getters and Setters
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        
        public String getRollNumber() { return rollNumber; }
        public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
        
        public Integer getPresent() { return present; }
        public void setPresent(Integer present) { this.present = present; }
        
        public Integer getAbsent() { return absent; }
        public void setAbsent(Integer absent) { this.absent = absent; }
        
        public Integer getLate() { return late; }
        public void setLate(Integer late) { this.late = late; }
        
        public Integer getExcused() { return excused; }
        public void setExcused(Integer excused) { this.excused = excused; }
        
        public Double getPercentage() { return percentage; }
        public void setPercentage(Double percentage) { this.percentage = percentage; }
        
        public Map<Integer, String> getDailyAttendance() { return dailyAttendance; }
        public void setDailyAttendance(Map<Integer, String> dailyAttendance) { this.dailyAttendance = dailyAttendance; }
    }

    // Constructors
    public MonthlyAttendanceReportDTO() {}

    // Getters and Setters
    public Long getFacultyId() { return facultyId; }
    public void setFacultyId(Long facultyId) { this.facultyId = facultyId; }
    
    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public YearMonth getMonth() { return month; }
    public void setMonth(YearMonth month) { this.month = month; }
    
    public Integer getTotalClasses() { return totalClasses; }
    public void setTotalClasses(Integer totalClasses) { this.totalClasses = totalClasses; }
    
    public Integer getTotalPresent() { return totalPresent; }
    public void setTotalPresent(Integer totalPresent) { this.totalPresent = totalPresent; }
    
    public Integer getTotalAbsent() { return totalAbsent; }
    public void setTotalAbsent(Integer totalAbsent) { this.totalAbsent = totalAbsent; }
    
    public Integer getTotalLate() { return totalLate; }
    public void setTotalLate(Integer totalLate) { this.totalLate = totalLate; }
    
    public Integer getTotalExcused() { return totalExcused; }
    public void setTotalExcused(Integer totalExcused) { this.totalExcused = totalExcused; }
    
    public Double getAttendancePercentage() { return attendancePercentage; }
    public void setAttendancePercentage(Double attendancePercentage) { this.attendancePercentage = attendancePercentage; }
    
    public List<StudentAttendanceSummary> getStudentSummaries() { return studentSummaries; }
    public void setStudentSummaries(List<StudentAttendanceSummary> studentSummaries) { this.studentSummaries = studentSummaries; }
}
