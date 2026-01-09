package com.studenttrack.dto;

import java.util.HashMap;
import java.util.Map;

/**
 * Attendance report details for a student over a date range.
 * Extended to support statusCounts map and averageAttendance percentage
 * expected by the React StudentReport component.
 */
public class AttendanceReportDTO {
    private int totalClasses;
    private int present;
    private int absent;
    private int late;
    private Double averageAttendance; // percentage 0-100
    private Map<String, Long> statusCounts; // PRESENT/ABSENT/LATE/EXCUSED etc.

    public AttendanceReportDTO() {
        this.statusCounts = new HashMap<>();
    }

    public int getTotalClasses() {
        return totalClasses;
    }

    public void setTotalClasses(int totalClasses) {
        this.totalClasses = totalClasses;
    }

    public int getPresent() {
        return present;
    }

    public void setPresent(int present) {
        this.present = present;
    }

    public int getAbsent() {
        return absent;
    }

    public void setAbsent(int absent) {
        this.absent = absent;
    }

    public int getLate() {
        return late;
    }

    public void setLate(int late) {
        this.late = late;
    }

    public Double getAverageAttendance() {
        return averageAttendance;
    }

    public void setAverageAttendance(Double averageAttendance) {
        this.averageAttendance = averageAttendance;
    }

    public Map<String, Long> getStatusCounts() {
        return statusCounts;
    }

    public void setStatusCounts(Map<String, Long> statusCounts) {
        this.statusCounts = statusCounts;
    }
}