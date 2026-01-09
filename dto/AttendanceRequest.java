package com.studenttrack.dto;

import com.studenttrack.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Map;

public class AttendanceRequest {
    @NotNull
    private LocalDate date;

    @NotNull
    private Map<Long, AttendanceStatus> studentAttendance; // Map of studentId -> status

    private String remarks;

    // Optional subject for attendance (faculty selects subject when marking)
    private String subject;

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Map<Long, AttendanceStatus> getStudentAttendance() {
        return studentAttendance;
    }

    public void setStudentAttendance(Map<Long, AttendanceStatus> studentAttendance) {
        this.studentAttendance = studentAttendance;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }
}

