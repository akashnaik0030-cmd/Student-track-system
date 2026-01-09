package com.studenttrack.dto;

import com.studenttrack.entity.AttendanceStatus;
import java.util.Map;

public class AttendanceSummaryDTO {
    private Long studentId;
    private String studentName;
    private Map<AttendanceStatus, Long> statusCounts;
    private Long totalDays;
    private Double attendancePercentage;

    public AttendanceSummaryDTO() {}

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

    public Map<AttendanceStatus, Long> getStatusCounts() {
        return statusCounts;
    }

    public void setStatusCounts(Map<AttendanceStatus, Long> statusCounts) {
        this.statusCounts = statusCounts;
    }

    public Long getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Long totalDays) {
        this.totalDays = totalDays;
    }

    public Double getAttendancePercentage() {
        return attendancePercentage;
    }

    public void setAttendancePercentage(Double attendancePercentage) {
        this.attendancePercentage = attendancePercentage;
    }
}


