package com.studenttrack.dto;

import java.util.List;

public class AssessmentMarksReportDTO {
    private Long facultyId;
    private String facultyName;
    private String subject;
    private String assessmentType;
    private Integer maxMarks;
    private Double averageMarks;
    private Integer totalStudents;
    private Integer studentsAboveAverage;
    private Integer studentsBelowAverage;
    private List<StudentMarksSummary> studentMarks;

    public static class StudentMarksSummary {
        private Long studentId;
        private String studentName;
        private String rollNumber;
        private Integer marksObtained;
        private Integer maxMarks;
        private Double percentage;
        private String grade;

        // Constructors
        public StudentMarksSummary() {}

        public StudentMarksSummary(Long studentId, String studentName, String rollNumber, 
                                  Integer marksObtained, Integer maxMarks, Double percentage, String grade) {
            this.studentId = studentId;
            this.studentName = studentName;
            this.rollNumber = rollNumber;
            this.marksObtained = marksObtained;
            this.maxMarks = maxMarks;
            this.percentage = percentage;
            this.grade = grade;
        }

        // Getters and Setters
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        
        public String getRollNumber() { return rollNumber; }
        public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
        
        public Integer getMarksObtained() { return marksObtained; }
        public void setMarksObtained(Integer marksObtained) { this.marksObtained = marksObtained; }
        
        public Integer getMaxMarks() { return maxMarks; }
        public void setMaxMarks(Integer maxMarks) { this.maxMarks = maxMarks; }
        
        public Double getPercentage() { return percentage; }
        public void setPercentage(Double percentage) { this.percentage = percentage; }
        
        public String getGrade() { return grade; }
        public void setGrade(String grade) { this.grade = grade; }
    }

    // Constructors
    public AssessmentMarksReportDTO() {}

    // Getters and Setters
    public Long getFacultyId() { return facultyId; }
    public void setFacultyId(Long facultyId) { this.facultyId = facultyId; }
    
    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public String getAssessmentType() { return assessmentType; }
    public void setAssessmentType(String assessmentType) { this.assessmentType = assessmentType; }
    
    public Integer getMaxMarks() { return maxMarks; }
    public void setMaxMarks(Integer maxMarks) { this.maxMarks = maxMarks; }
    
    public Double getAverageMarks() { return averageMarks; }
    public void setAverageMarks(Double averageMarks) { this.averageMarks = averageMarks; }
    
    public Integer getTotalStudents() { return totalStudents; }
    public void setTotalStudents(Integer totalStudents) { this.totalStudents = totalStudents; }
    
    public Integer getStudentsAboveAverage() { return studentsAboveAverage; }
    public void setStudentsAboveAverage(Integer studentsAboveAverage) { this.studentsAboveAverage = studentsAboveAverage; }
    
    public Integer getStudentsBelowAverage() { return studentsBelowAverage; }
    public void setStudentsBelowAverage(Integer studentsBelowAverage) { this.studentsBelowAverage = studentsBelowAverage; }
    
    public List<StudentMarksSummary> getStudentMarks() { return studentMarks; }
    public void setStudentMarks(List<StudentMarksSummary> studentMarks) { this.studentMarks = studentMarks; }
}
