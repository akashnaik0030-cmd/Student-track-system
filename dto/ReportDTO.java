package com.studenttrack.dto;

public class ReportDTO {
    private AttendanceReportDTO attendanceReport;
    private AcademicReportDTO academicReport;
    private TaskReportDTO taskReport;

    public AttendanceReportDTO getAttendanceReport() {
        return attendanceReport;
    }

    public void setAttendanceReport(AttendanceReportDTO attendanceReport) {
        this.attendanceReport = attendanceReport;
    }

    public AcademicReportDTO getAcademicReport() {
        return academicReport;
    }

    public void setAcademicReport(AcademicReportDTO academicReport) {
        this.academicReport = academicReport;
    }

    public TaskReportDTO getTaskReport() {
        return taskReport;
    }

    public void setTaskReport(TaskReportDTO taskReport) {
        this.taskReport = taskReport;
    }
}