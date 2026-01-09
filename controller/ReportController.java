package com.studenttrack.controller;

import com.studenttrack.dto.*;
import com.studenttrack.security.UserPrincipal;
import com.studenttrack.service.AuthService;
import com.studenttrack.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final AuthService authService;

    @Autowired
    public ReportController(ReportService reportService, AuthService authService) {
        this.reportService = reportService;
        this.authService = authService;
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'HOD') or @userSecurity.isCurrentUser(#studentId)")
    public ResponseEntity<ReportDTO> getStudentReport(
            @PathVariable Long studentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        ReportDTO report = reportService.generateStudentReport(studentId, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'HOD')")
    public ResponseEntity<List<ReportDTO>> getClassReport(
            @PathVariable Long classId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        // Get class students' reports
        List<ReportDTO> reports = reportService.generateClassReport(classId, startDate, endDate);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<List<ReportDTO>> getDepartmentReport(
            @PathVariable Long departmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<ReportDTO> reports = reportService.generateDepartmentReport(departmentId, startDate, endDate);
        return ResponseEntity.ok(reports);
    }

    // Monthly Attendance Report - Faculty can see only their subjects, HOD can see all
    @GetMapping("/attendance/monthly")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD')")
    public ResponseEntity<List<MonthlyAttendanceReportDTO>> getMonthlyAttendanceReport(
            @RequestParam(required = false) Long facultyId,
            @RequestParam(required = false) String subject,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        
        List<MonthlyAttendanceReportDTO> reports = reportService.generateMonthlyAttendanceReport(facultyId, subject, month);
        return ResponseEntity.ok(reports);
    }

    // Assessment-wise Marks Report - Faculty can see only their subjects, HOD can see all
    @GetMapping("/marks/assessment")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD')")
    public ResponseEntity<List<AssessmentMarksReportDTO>> getAssessmentMarksReport(
            @RequestParam(required = false) Long facultyId,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String assessmentType) {
        
        List<AssessmentMarksReportDTO> reports = reportService.generateAssessmentMarksReport(facultyId, subject, assessmentType);
        return ResponseEntity.ok(reports);
    }

    // Assignment/Task-wise Submission Report - Faculty can see only their tasks, HOD can see all
    @GetMapping("/submissions/task")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD')")
    public ResponseEntity<List<SubmissionReportDTO>> getSubmissionReport(
            @RequestParam(required = false) Long facultyId,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) Long taskId) {
        
        List<SubmissionReportDTO> reports = reportService.generateSubmissionReport(facultyId, subject, taskId);
        return ResponseEntity.ok(reports);
    }

    // Get unique subjects for a faculty (for dropdown filters)
    @GetMapping("/faculty/{facultyId}/subjects")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD')")
    public ResponseEntity<List<String>> getFacultySubjects(@PathVariable Long facultyId) {
        List<String> subjects = reportService.getFacultySubjects(facultyId);
        return ResponseEntity.ok(subjects);
    }

    // Get all faculty list (for HOD dropdown)
    @GetMapping("/faculty/list")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<List<FacultySummaryDTO>> getAllFaculty() {
        List<FacultySummaryDTO> faculty = reportService.getAllFaculty();
        return ResponseEntity.ok(faculty);
    }

    /**
     * Generate ALL students detailed report (sorted by roll number)
     * Faculty sees only their students (from their tasks), HOD sees all students
     */
    @GetMapping("/all-students")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD')")
    public ResponseEntity<List<StudentDetailedReportDTO>> getAllStudentsReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        // Get current user to determine if HOD or Faculty
        UserPrincipal currentUser = authService.getCurrentUser();
        boolean isHOD = currentUser != null && currentUser.getAuthorities().stream()
            .anyMatch(authority -> "ROLE_HOD".equals(authority.getAuthority()));
        
        // Faculty only sees their students, HOD sees all
        Long facultyId = isHOD ? null : currentUser.getId();
        
        List<StudentDetailedReportDTO> reports = reportService.generateAllStudentsReport(startDate, endDate, facultyId);
        return ResponseEntity.ok(reports);
    }

    /**
     * Generate ALL faculty performance report
     * Only HOD can view this report
     */
    @GetMapping("/all-faculty")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<List<FacultyPerformanceReportDTO>> getAllFacultyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<FacultyPerformanceReportDTO> reports = reportService.generateAllFacultyReport(startDate, endDate);
        return ResponseEntity.ok(reports);
    }

    /**
     * Get tasks list for dropdown (for task report)
     * Faculty gets their tasks, HOD can filter by faculty or get all
     */
    @GetMapping("/tasks/list")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD')")
    public ResponseEntity<List<TaskSummaryDTO>> getTasksList(
            @RequestParam(required = false) Long facultyId) {
        
        // If faculty role and no facultyId specified, use current user's ID
        UserPrincipal currentUser = authService.getCurrentUser();
        if (currentUser != null && facultyId == null) {
            boolean isHOD = currentUser.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_HOD".equals(authority.getAuthority()));
            if (!isHOD) {
                // Faculty user - filter by their own ID
                facultyId = currentUser.getId();
            }
        }
        
        List<TaskSummaryDTO> tasks = reportService.getTasksForDropdown(facultyId);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Generate task-wise report for a specific task
     * Shows all students assigned to the selected task
     */
    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD')")
    public ResponseEntity<List<TaskWiseReportDTO>> getTaskWiseReport(
            @RequestParam(required = false) Long facultyId,
            @RequestParam(required = false) Long taskId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<TaskWiseReportDTO> reports = reportService.generateTaskWiseReport(facultyId, taskId, startDate, endDate);
        return ResponseEntity.ok(reports);
    }

    public static class FacultySummaryDTO {
        private Long id;
        private String name;
        private String email;

        public FacultySummaryDTO(Long id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class TaskSummaryDTO {
        private Long id;
        private String title;
        private String subject;
        private String description;
        private LocalDate startDate;
        private LocalDate dueDate;
        private String facultyName;
        private Integer totalStudents;

        public TaskSummaryDTO(Long id, String title, String subject, String description, 
                             LocalDate startDate, LocalDate dueDate, String facultyName, Integer totalStudents) {
            this.id = id;
            this.title = title;
            this.subject = subject;
            this.description = description;
            this.startDate = startDate;
            this.dueDate = dueDate;
            this.facultyName = facultyName;
            this.totalStudents = totalStudents;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        
        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
        
        public String getFacultyName() { return facultyName; }
        public void setFacultyName(String facultyName) { this.facultyName = facultyName; }
        
        public Integer getTotalStudents() { return totalStudents; }
        public void setTotalStudents(Integer totalStudents) { this.totalStudents = totalStudents; }
    }
}