package com.studenttrack.service;

import com.studenttrack.dto.*;
import com.studenttrack.entity.*;
import com.studenttrack.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private AttendanceRepository attendanceRepository;
    @Autowired
    private MarksRepository marksRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private SubmissionRepository submissionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private QuizRepository quizRepository;
    @Autowired
    private QuizAttemptRepository quizAttemptRepository;
    @Autowired
    private FeedbackRepository feedbackRepository;
    @Autowired
    private AuthService authService;

    /**
     * Generates a comprehensive student report used by StudentReport.js.
     * Null-safe and defensive: any missing segment returns empty/default data.
     */
    public ReportDTO generateStudentReport(Long studentId, LocalDate startDate, LocalDate endDate) {
        ReportDTO dto = new ReportDTO();
        // Defensive null check for studentId to avoid potential NPE/validation issues.
        if (studentId == null) {
            return dto;
        }
        Optional<User> studentOpt = userRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return dto; // empty
        }
        User student = studentOpt.get();

        // Attendance segment
        AttendanceReportDTO attendanceReport = buildAttendanceReport(student, startDate, endDate);
        dto.setAttendanceReport(attendanceReport);

        // Academic segment (marks)
        AcademicReportDTO academicReport = buildAcademicReport(student, startDate, endDate);
        dto.setAcademicReport(academicReport);

        // Task segment
        TaskReportDTO taskReport = buildTaskReport(student, startDate, endDate);
        dto.setTaskReport(taskReport);

        return dto;
    }

    private AttendanceReportDTO buildAttendanceReport(User student, LocalDate startDate, LocalDate endDate) {
        AttendanceReportDTO a = new AttendanceReportDTO();
        if (startDate == null) startDate = LocalDate.now().minusMonths(1);
        if (endDate == null) endDate = LocalDate.now();
        List<Attendance> records = attendanceRepository.findByStudentIdAndDateBetween(student.getId(), startDate, endDate);
        if (records == null || records.isEmpty()) {
            a.setTotalClasses(0);
            a.setAverageAttendance(0.0);
            a.setStatusCounts(new HashMap<>());
            return a;
        }
        int total = records.size();
        a.setTotalClasses(total);
        Map<String, Long> statusCounts = records.stream()
                .collect(Collectors.groupingBy(r -> r.getStatus().name(), Collectors.counting()));
        a.setStatusCounts(statusCounts);
        int present = statusCounts.getOrDefault(AttendanceStatus.PRESENT.name(), 0L).intValue();
        int absent = statusCounts.getOrDefault(AttendanceStatus.ABSENT.name(), 0L).intValue();
        int late = statusCounts.getOrDefault(AttendanceStatus.LATE.name(), 0L).intValue();
        a.setPresent(present);
        a.setAbsent(absent);
        a.setLate(late);
        double averagePct = total == 0 ? 0.0 : (present * 100.0) / total;
        a.setAverageAttendance(averagePct);
        return a;
    }

    private AcademicReportDTO buildAcademicReport(User student, LocalDate startDate, LocalDate endDate) {
        AcademicReportDTO academic = new AcademicReportDTO();
        if (startDate == null) startDate = LocalDate.now().minusMonths(1);
        if (endDate == null) endDate = LocalDate.now();
        List<Marks> marksList = marksRepository.findByStudentIdAndDateBetween(student.getId(), startDate, endDate);
        if (marksList == null) marksList = Collections.emptyList();

        Map<String, SubjectPerformanceDTO> subjectMap = new HashMap<>();
        List<AssessmentResultDTO> assessmentResults = new ArrayList<>();
        double totalObtained = 0;
        double totalMax = 0;
        for (Marks m : marksList) {
            if (m.getMarks() == null || m.getMaxMarks() == null) continue;
            String subject = m.getSubject() == null ? "UNKNOWN" : m.getSubject();
            SubjectPerformanceDTO perf = subjectMap.computeIfAbsent(subject, s -> new SubjectPerformanceDTO());
            perf.updateStats(m.getMarks(), m.getMaxMarks());
            totalObtained += m.getMarks();
            totalMax += m.getMaxMarks();

            AssessmentResultDTO ar = new AssessmentResultDTO();
            ar.setAssessmentType(m.getAssessmentType() == null ? "UNKNOWN" : m.getAssessmentType());
            ar.setSubject(subject);
            ar.setDate(m.getDate());
            ar.setMarksObtained(m.getMarks().doubleValue());
            ar.setMaxMarks(m.getMaxMarks().doubleValue());
            ar.setPercentage(m.getMaxMarks() != null && m.getMaxMarks() > 0 ? (m.getMarks() * 100.0) / m.getMaxMarks() : 0.0);
            assessmentResults.add(ar);
        }
        academic.setSubjectPerformance(subjectMap);
        academic.setAssessmentResults(assessmentResults);
        academic.setOverallAverage(totalMax == 0 ? 0.0 : (totalObtained * 100.0) / totalMax);
        return academic;
    }

    private TaskReportDTO buildTaskReport(User student, LocalDate startDate, LocalDate endDate) {
        TaskReportDTO taskReport = new TaskReportDTO();
        // Fetch tasks assigned to student (date filtering not currently stored except dueDate)
        List<Task> tasks = taskRepository.findByAssignedToId(student.getId());
        if (tasks == null || tasks.isEmpty()) {
            taskReport.setTotalTasks(0);
            taskReport.setCompletedTasks(0);
            taskReport.setPendingTasks(0);
            taskReport.setLateTasks(0);
            taskReport.setCompletionRate(0.0);
            taskReport.setRecentSubmissions(Collections.emptyList());
            return taskReport;
        }
        int total = tasks.size();
        int completed = (int) tasks.stream().filter(t -> t.getStatus() != null && t.getStatus().name().equalsIgnoreCase("COMPLETED")).count();
        int pending = (int) tasks.stream().filter(t -> t.getStatus() != null && t.getStatus().name().equalsIgnoreCase("PENDING")).count();
        int late = (int) tasks.stream().filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now().atStartOfDay()) && (t.getStatus() == null || !t.getStatus().name().equalsIgnoreCase("COMPLETED"))).count();
        taskReport.setTotalTasks(total);
        taskReport.setCompletedTasks(completed);
        taskReport.setPendingTasks(pending);
        taskReport.setLateTasks(late);
        taskReport.setCompletionRate(total == 0 ? 0.0 : (completed * 100.0) / total);

        // Recent submissions (limit 10, sorted by submittedAt desc)
        List<Submission> submissions = submissionRepository.findByStudent(student);
        if (submissions == null) submissions = Collections.emptyList();
        List<TaskSubmissionDTO> recent = submissions.stream()
                .sorted((a, b) -> {
                    LocalDateTime at = a.getSubmittedAt();
                    LocalDateTime bt = b.getSubmittedAt();
                    if (at == null && bt == null) return 0;
                    if (at == null) return 1;
                    if (bt == null) return -1;
                    return bt.compareTo(at);
                })
                .limit(10)
                .map(s -> {
                    TaskSubmissionDTO ts = new TaskSubmissionDTO();
                    ts.setTaskId(s.getTask() != null ? s.getTask().getId() : null);
                    ts.setTaskTitle(s.getTask() != null ? safeString(s.getTask().getTitle()) : "");
                    ts.setStatus(safeString(s.getStatus()));
                    ts.setSubmittedAt(s.getSubmittedAt());
                    ts.setDueDate(s.getTask() != null ? s.getTask().getDueDate() : null);
                    ts.setFeedback(safeString(s.getFacultyRemark()));
                    return ts;
                })
                .collect(Collectors.toList());
        taskReport.setRecentSubmissions(recent);
        return taskReport;
    }

    private String safeString(String s) { return s == null ? "" : s; }

    public List<ReportDTO> generateClassReport(Long classId, LocalDate startDate, LocalDate endDate) {
        try {
            List<com.studenttrack.entity.Student> students = studentRepository.findByClassId(classId);
            if (students == null) return Collections.emptyList();
            return students.stream().map(s -> generateStudentReport(s.getId(), startDate, endDate)).collect(Collectors.toList());
        } catch (Throwable t) {
            return Collections.emptyList();
        }
    }

    public List<ReportDTO> generateDepartmentReport(Long departmentId, LocalDate startDate, LocalDate endDate) {
        try {
            List<com.studenttrack.entity.Student> students = studentRepository.findByDepartmentId(departmentId);
            if (students == null) return Collections.emptyList();
            return students.stream().map(s -> generateStudentReport(s.getId(), startDate, endDate)).collect(Collectors.toList());
        } catch (Throwable t) {
            return Collections.emptyList();
        }
    }

    /**
     * Generate monthly attendance report by faculty and subject
     */
    public List<MonthlyAttendanceReportDTO> generateMonthlyAttendanceReport(Long facultyId, String subject, YearMonth month) {
        LocalDate startDate = month.atDay(1);
        LocalDate endDate = month.atEndOfMonth();
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        // Get attendance records
        List<Attendance> attendanceRecords;
        if (facultyId != null && subject != null) {
            // Faculty viewing their own subject report
            attendanceRecords = attendanceRepository.findByFacultyIdAndDateBetween(facultyId, startDate, endDate)
                .stream()
                .filter(a -> subject.equalsIgnoreCase(a.getSubject()))
                .collect(Collectors.toList());
        } else if (facultyId != null) {
            // Faculty viewing all their subjects
            attendanceRecords = attendanceRepository.findByFacultyIdAndDateBetween(facultyId, startDate, endDate);
        } else {
            // HOD viewing all faculty
            attendanceRecords = attendanceRepository.findAll().stream()
                .filter(a -> !a.getDate().isBefore(startDate) && !a.getDate().isAfter(endDate))
                .collect(Collectors.toList());
        }

        // Group by faculty and subject
        Map<String, List<Attendance>> groupedRecords = attendanceRecords.stream()
            .collect(Collectors.groupingBy(a -> a.getFaculty().getId() + "_" + (a.getSubject() != null ? a.getSubject() : "NO_SUBJECT")));

        List<MonthlyAttendanceReportDTO> reports = new ArrayList<>();
        for (Map.Entry<String, List<Attendance>> entry : groupedRecords.entrySet()) {
            List<Attendance> records = entry.getValue();
            if (records.isEmpty()) continue;

            MonthlyAttendanceReportDTO report = new MonthlyAttendanceReportDTO();
            Attendance first = records.get(0);
            report.setFacultyId(first.getFaculty().getId());
            report.setFacultyName(first.getFaculty().getFullName());
            report.setSubject(first.getSubject());
            report.setMonth(month);

            // Calculate statistics
            Map<Long, List<Attendance>> studentRecords = records.stream()
                .collect(Collectors.groupingBy(a -> a.getStudent().getId()));

            Set<LocalDate> uniqueDates = records.stream().map(Attendance::getDate).collect(Collectors.toSet());
            report.setTotalClasses(uniqueDates.size());

            int totalPresent = 0, totalAbsent = 0, totalLate = 0, totalExcused = 0;
            List<MonthlyAttendanceReportDTO.StudentAttendanceSummary> summaries = new ArrayList<>();

            for (Map.Entry<Long, List<Attendance>> studentEntry : studentRecords.entrySet()) {
                List<Attendance> studentAttendance = studentEntry.getValue();
                User student = studentAttendance.get(0).getStudent();

                int present = (int) studentAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
                int absent = (int) studentAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
                int late = (int) studentAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
                int excused = (int) studentAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.EXCUSED).count();

                totalPresent += present;
                totalAbsent += absent;
                totalLate += late;
                totalExcused += excused;

                double percentage = uniqueDates.size() > 0 ? ((double) present / uniqueDates.size()) * 100 : 0.0;

                // Build daily attendance map (day of month -> status)
                Map<Integer, String> dailyAttendance = new java.util.HashMap<>();
                for (Attendance att : studentAttendance) {
                    int dayOfMonth = att.getDate().getDayOfMonth();
                    dailyAttendance.put(dayOfMonth, att.getStatus().name());
                }

                MonthlyAttendanceReportDTO.StudentAttendanceSummary summary = new MonthlyAttendanceReportDTO.StudentAttendanceSummary(
                    student.getId(),
                    student.getFullName(),
                    student.getRollNumber(),
                    present, absent, late, excused, percentage
                );
                summary.setDailyAttendance(dailyAttendance);
                summaries.add(summary);
            }

            report.setTotalPresent(totalPresent);
            report.setTotalAbsent(totalAbsent);
            report.setTotalLate(totalLate);
            report.setTotalExcused(totalExcused);
            
            int totalRecords = totalPresent + totalAbsent + totalLate + totalExcused;
            report.setAttendancePercentage(totalRecords > 0 ? ((double) totalPresent / totalRecords) * 100 : 0.0);
            report.setStudentSummaries(summaries);

            reports.add(report);
        }

        return reports;
    }

    /**
     * Generate assessment-wise marks report
     */
    public List<AssessmentMarksReportDTO> generateAssessmentMarksReport(Long facultyId, String subject, String assessmentType) {
        List<Marks> marksRecords;

        if (facultyId != null && subject != null && assessmentType != null) {
            // Faculty viewing specific subject and assessment
            marksRecords = marksRepository.findAll().stream()
                .filter(m -> m.getFaculty() != null && m.getFaculty().getId().equals(facultyId))
                .filter(m -> subject.equalsIgnoreCase(m.getSubject()))
                .filter(m -> m.getAssessmentType() != null && assessmentType.equalsIgnoreCase(m.getAssessmentType()))
                .collect(Collectors.toList());
        } else if (facultyId != null && subject != null) {
            // Faculty viewing specific subject, all assessments
            marksRecords = marksRepository.findAll().stream()
                .filter(m -> m.getFaculty() != null && m.getFaculty().getId().equals(facultyId))
                .filter(m -> subject.equalsIgnoreCase(m.getSubject()))
                .collect(Collectors.toList());
        } else if (facultyId != null) {
            // Faculty viewing all their subjects
            marksRecords = marksRepository.findAll().stream()
                .filter(m -> m.getFaculty() != null && m.getFaculty().getId().equals(facultyId))
                .collect(Collectors.toList());
        } else {
            // HOD viewing all faculty
            marksRecords = marksRepository.findAll();
        }

        // Group by faculty, subject, and assessment type
        Map<String, List<Marks>> groupedMarks = marksRecords.stream()
            .filter(m -> m.getFaculty() != null && m.getSubject() != null && m.getAssessmentType() != null)
            .collect(Collectors.groupingBy(m -> 
                m.getFaculty().getId() + "_" + m.getSubject() + "_" + m.getAssessmentType()));

        List<AssessmentMarksReportDTO> reports = new ArrayList<>();
        for (Map.Entry<String, List<Marks>> entry : groupedMarks.entrySet()) {
            List<Marks> marks = entry.getValue();
            if (marks.isEmpty()) continue;

            AssessmentMarksReportDTO report = new AssessmentMarksReportDTO();
            Marks first = marks.get(0);
            report.setFacultyId(first.getFaculty().getId());
            report.setFacultyName(first.getFaculty().getFullName());
            report.setSubject(first.getSubject());
            report.setAssessmentType(first.getAssessmentType());
            report.setMaxMarks(first.getMaxMarks());

            double avgMarks = marks.stream()
                .mapToInt(m -> m.getMarks() != null ? m.getMarks() : 0)
                .average().orElse(0.0);
            report.setAverageMarks(avgMarks);
            report.setTotalStudents(marks.size());

            long aboveAvg = marks.stream()
                .filter(m -> m.getMarks() != null && m.getMarks() >= avgMarks)
                .count();
            report.setStudentsAboveAverage((int) aboveAvg);
            report.setStudentsBelowAverage(marks.size() - (int) aboveAvg);

            List<AssessmentMarksReportDTO.StudentMarksSummary> studentMarks = marks.stream()
                .map(m -> {
                    double percentage = m.getMaxMarks() != null && m.getMaxMarks() > 0 && m.getMarks() != null
                        ? ((double) m.getMarks() / m.getMaxMarks()) * 100 : 0.0;
                    String grade = getGrade(percentage);
                    
                    return new AssessmentMarksReportDTO.StudentMarksSummary(
                        m.getStudent().getId(),
                        m.getStudent().getFullName(),
                        m.getStudent().getRollNumber(),
                        m.getMarks(),
                        m.getMaxMarks(),
                        percentage,
                        grade
                    );
                })
                .collect(Collectors.toList());

            report.setStudentMarks(studentMarks);
            reports.add(report);
        }

        return reports;
    }

    /**
     * Generate task/assignment-wise submission report
     */
    public List<SubmissionReportDTO> generateSubmissionReport(Long facultyId, String subject, Long taskId) {
        List<Task> tasks;

        if (taskId != null) {
            // Specific task - get this task and all related tasks (same title, subject, due date)
            Optional<Task> taskOpt = taskRepository.findById(taskId);
            if (taskOpt.isPresent()) {
                Task selectedTask = taskOpt.get();
                tasks = taskRepository.findAll().stream()
                    .filter(t -> t.getTitle().equals(selectedTask.getTitle()) &&
                                 t.getSubject().equals(selectedTask.getSubject()) &&
                                 t.getDueDate() != null && selectedTask.getDueDate() != null &&
                                 t.getDueDate().equals(selectedTask.getDueDate()))
                    .collect(Collectors.toList());
            } else {
                tasks = Collections.emptyList();
            }
        } else if (facultyId != null && subject != null) {
            // Faculty's specific subject
            tasks = taskRepository.findAll().stream()
                .filter(t -> t.getAssignedBy() != null && t.getAssignedBy().getId().equals(facultyId))
                .filter(t -> subject.equalsIgnoreCase(t.getSubject()))
                .collect(Collectors.toList());
        } else if (facultyId != null) {
            // All tasks by faculty
            tasks = taskRepository.findAll().stream()
                .filter(t -> t.getAssignedBy() != null && t.getAssignedBy().getId().equals(facultyId))
                .collect(Collectors.toList());
        } else {
            // HOD viewing all tasks
            tasks = taskRepository.findAll();
        }

        // Group tasks by title, subject, due date (same assignment to multiple students)
        Map<String, List<Task>> groupedTasks = tasks.stream()
            .filter(t -> t.getAssignedBy() != null)
            .collect(Collectors.groupingBy(t -> 
                t.getTitle() + "|" + t.getSubject() + "|" + 
                (t.getDueDate() != null ? t.getDueDate().toString() : "null")
            ));

        List<SubmissionReportDTO> reports = new ArrayList<>();
        for (List<Task> taskGroup : groupedTasks.values()) {
            if (taskGroup.isEmpty()) continue;
            
            Task firstTask = taskGroup.get(0);
            SubmissionReportDTO report = new SubmissionReportDTO();
            report.setFacultyId(firstTask.getAssignedBy().getId());
            report.setFacultyName(firstTask.getAssignedBy().getFullName());
            report.setSubject(firstTask.getSubject());
            report.setTaskId(firstTask.getId());
            report.setTaskTitle(firstTask.getTitle());
            report.setTaskDueDate(firstTask.getDueDate());

            // Collect all students and their submissions
            List<SubmissionReportDTO.StudentSubmissionSummary> studentSubmissions = new ArrayList<>();
            int submitted = 0;
            int onTime = 0;
            int late = 0;
            
            for (Task task : taskGroup) {
                User assignedStudent = task.getAssignedTo();
                if (assignedStudent == null) continue;
                
                // Find submission for this task
                List<Submission> submissions = submissionRepository.findByTask(task);
                Submission studentSubmission = submissions != null && !submissions.isEmpty() ? submissions.get(0) : null;
                
                // Create summary for this student
                String status = studentSubmission != null && studentSubmission.getStatus() != null ? 
                    studentSubmission.getStatus() : "PENDING";
                
                SubmissionReportDTO.StudentSubmissionSummary summary = new SubmissionReportDTO.StudentSubmissionSummary(
                    assignedStudent.getId(),
                    assignedStudent.getFullName(),
                    assignedStudent.getRollNumber(),
                    status,
                    studentSubmission != null ? studentSubmission.getSubmissionTimeliness() : null,
                    studentSubmission != null ? studentSubmission.getSubmittedAt() : null,
                    studentSubmission != null ? studentSubmission.getFacultyRemark() : null,
                    studentSubmission != null ? studentSubmission.getMarkedCompleteAt() : null
                );
                studentSubmissions.add(summary);
                
                // Update statistics
                if ("COMPLETED".equals(status)) submitted++;
                if (studentSubmission != null && "ON_TIME".equals(studentSubmission.getSubmissionTimeliness())) onTime++;
                if (studentSubmission != null && "LATE".equals(studentSubmission.getSubmissionTimeliness())) late++;
            }
            
            int totalStudents = studentSubmissions.size();
            int pending = totalStudents - submitted;
            
            report.setTotalStudents(totalStudents);
            report.setSubmittedCount(submitted);
            report.setPendingCount(pending);
            report.setOnTimeCount(onTime);
            report.setLateCount(late);
            report.setSubmissionRate(totalStudents > 0 ? ((double) submitted / totalStudents) * 100 : 0.0);
            report.setStudentSubmissions(studentSubmissions);
            reports.add(report);
        }

        return reports;
    }

    /**
     * Get unique subjects taught by a faculty
     */
    public List<String> getFacultySubjects(Long facultyId) {
        Set<String> subjects = new HashSet<>();

        // From tasks
        List<Task> tasks = taskRepository.findAll().stream()
            .filter(t -> t.getAssignedBy() != null && t.getAssignedBy().getId().equals(facultyId))
            .collect(Collectors.toList());
        tasks.forEach(t -> {
            if (t.getSubject() != null) subjects.add(t.getSubject());
        });

        // From attendance
        List<Attendance> attendance = attendanceRepository.findAll().stream()
            .filter(a -> a.getFaculty() != null && a.getFaculty().getId().equals(facultyId))
            .collect(Collectors.toList());
        attendance.forEach(a -> {
            if (a.getSubject() != null) subjects.add(a.getSubject());
        });

        // From marks
        List<Marks> marks = marksRepository.findAll().stream()
            .filter(m -> m.getFaculty() != null && m.getFaculty().getId().equals(facultyId))
            .collect(Collectors.toList());
        marks.forEach(m -> {
            if (m.getSubject() != null) subjects.add(m.getSubject());
        });

        return new ArrayList<>(subjects);
    }

    /**
     * Get all faculty for HOD dropdown
     */
    public List<com.studenttrack.controller.ReportController.FacultySummaryDTO> getAllFaculty() {
        List<User> faculty = userRepository.findAll().stream()
            .filter(u -> u.getRoles() != null && u.getRoles().stream()
                .anyMatch(r -> r.getName() == com.studenttrack.entity.ERole.ROLE_FACULTY))
            .collect(Collectors.toList());

        return faculty.stream()
            .map(f -> new com.studenttrack.controller.ReportController.FacultySummaryDTO(
                f.getId(),
                f.getFullName(),
                f.getEmail()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Get all tasks for dropdown menu
     * Faculty gets only their tasks, HOD gets all tasks (optionally filtered by faculty)
     */
    public List<com.studenttrack.controller.ReportController.TaskSummaryDTO> getTasksForDropdown(Long facultyId) {
        List<Task> tasks;
        
        if (facultyId != null) {
            // Filter by faculty
            tasks = taskRepository.findAll().stream()
                .filter(t -> t.getAssignedBy() != null && t.getAssignedBy().getId().equals(facultyId))
                .collect(Collectors.toList());
        } else {
            // Get all tasks
            tasks = taskRepository.findAll();
        }
        
        // Group tasks by title/subject/dueDate to avoid duplicates
        Map<String, Task> uniqueTasks = new java.util.LinkedHashMap<>();
        for (Task task : tasks) {
            if (task.getAssignedBy() != null) {
                String key = task.getTitle() + "|" + task.getSubject() + "|" + 
                            (task.getDueDate() != null ? task.getDueDate().toString() : "null") + "|" +
                            task.getAssignedBy().getId();
                uniqueTasks.putIfAbsent(key, task);
            }
        }
        
        return uniqueTasks.values().stream()
            .sorted((t1, t2) -> {
                if (t1.getCreatedAt() == null && t2.getCreatedAt() == null) return 0;
                if (t1.getCreatedAt() == null) return 1;
                if (t2.getCreatedAt() == null) return -1;
                return t2.getCreatedAt().compareTo(t1.getCreatedAt()); // Latest first
            })
            .map(t -> {
                // Count total students for this task (same title/subject/dueDate/faculty)
                long studentCount = tasks.stream()
                    .filter(task -> task.getTitle().equals(t.getTitle()) && 
                                  task.getSubject().equals(t.getSubject()) &&
                                  task.getAssignedBy().getId().equals(t.getAssignedBy().getId()) &&
                                  ((task.getDueDate() == null && t.getDueDate() == null) ||
                                   (task.getDueDate() != null && t.getDueDate() != null && 
                                    task.getDueDate().equals(t.getDueDate()))))
                    .count();
                
                return new com.studenttrack.controller.ReportController.TaskSummaryDTO(
                    t.getId(),
                    t.getTitle(),
                    t.getSubject(),
                    t.getDescription(),
                    t.getStartDate() != null ? t.getStartDate().toLocalDate() : null,
                    t.getDueDate() != null ? t.getDueDate().toLocalDate() : null,
                    t.getAssignedBy() != null ? t.getAssignedBy().getFullName() : "Unknown",
                    (int) studentCount
                );
            })
            .collect(Collectors.toList());
    }

    private String getGrade(double percentage) {
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B+";
        if (percentage >= 60) return "B";
        if (percentage >= 50) return "C";
        if (percentage >= 40) return "D";
        return "F";
    }

    /**
     * Generate comprehensive student detailed report for ALL students (sorted by roll number)
     * Faculty sees only their students (from assigned tasks), HOD sees all students
     * @param facultyId if null (HOD), show all students; if not null (Faculty), show only students assigned to this faculty's tasks
     */
    public List<StudentDetailedReportDTO> generateAllStudentsReport(LocalDate startDate, LocalDate endDate, Long facultyId) {
        // Get all users with STUDENT role
        List<User> students = userRepository.findAll().stream()
            .filter(u -> u.getRoles() != null && u.getRoles().stream()
                .anyMatch(r -> ERole.ROLE_STUDENT.equals(r.getName())))
            .collect(Collectors.toList());
        
        // If facultyId is provided (Faculty user), filter to only students assigned to their tasks
        if (facultyId != null) {
            // Get the faculty user object
            User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
            
            // Get all tasks assigned by this faculty
            List<Task> facultyTasks = taskRepository.findByAssignedBy(faculty);
            
            // Extract unique student IDs from tasks
            Set<Long> studentIds = facultyTasks.stream()
                .map(task -> task.getAssignedTo().getId())
                .collect(Collectors.toSet());
            
            // Filter students to only those assigned to this faculty's tasks
            students = students.stream()
                .filter(student -> studentIds.contains(student.getId()))
                .collect(Collectors.toList());
        }
        
        // Sort by roll number (handle nulls)
        students = students.stream()
            .sorted((s1, s2) -> {
                String roll1 = s1.getRollNumber();
                String roll2 = s2.getRollNumber();
                if (roll1 == null && roll2 == null) return 0;
                if (roll1 == null) return 1;
                if (roll2 == null) return -1;
                return roll1.compareTo(roll2);
            })
            .collect(Collectors.toList());
        
        // Generate report for each student
        return students.stream()
            .map(student -> {
                StudentDetailedReportDTO report = new StudentDetailedReportDTO();
                report.setStudentId(student.getId());
                report.setStudentName(student.getFullName());
                report.setRollNumber(student.getRollNumber());
                report.setEmail(student.getEmail());
                report.setStartDate(startDate);
                report.setEndDate(endDate);
                
                report.setAttendanceSummary(buildStudentAttendanceSummary(student, startDate, endDate));
                report.setAcademicPerformance(buildStudentAcademicPerformance(student, startDate, endDate));
                report.setTaskPerformance(buildStudentTaskPerformance(student, startDate, endDate));
                report.setQuizPerformance(buildStudentQuizPerformance(student, startDate, endDate));
                report.setFeedbackSummary(buildStudentFeedbackSummary(student, startDate, endDate));
                
                return report;
            })
            .collect(Collectors.toList());
    }
    
    private StudentDetailedReportDTO.AttendanceSummary buildStudentAttendanceSummary(User student, LocalDate startDate, LocalDate endDate) {
        StudentDetailedReportDTO.AttendanceSummary summary = new StudentDetailedReportDTO.AttendanceSummary();
        
        List<Attendance> records = attendanceRepository.findByStudentIdAndDateBetween(student.getId(), startDate, endDate);
        
        int total = records.size();
        int present = (int) records.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        int absent = (int) records.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        int late = (int) records.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
        int excused = (int) records.stream().filter(a -> a.getStatus() == AttendanceStatus.EXCUSED).count();
        
        summary.setTotalClasses(total);
        summary.setPresent(present);
        summary.setAbsent(absent);
        summary.setLate(late);
        summary.setExcused(excused);
        summary.setAttendancePercentage(total > 0 ? (present * 100.0 / total) : 0.0);
        
        // Monthly attendance
        Map<String, Integer> monthlyAttendance = records.stream()
            .filter(a -> a.getStatus() == AttendanceStatus.PRESENT)
            .collect(Collectors.groupingBy(
                a -> a.getDate().getYear() + "-" + String.format("%02d", a.getDate().getMonthValue()),
                Collectors.summingInt(a -> 1)
            ));
        summary.setMonthlyAttendance(monthlyAttendance);
        
        return summary;
    }
    
    private StudentDetailedReportDTO.AcademicPerformance buildStudentAcademicPerformance(User student, LocalDate startDate, LocalDate endDate) {
        StudentDetailedReportDTO.AcademicPerformance performance = new StudentDetailedReportDTO.AcademicPerformance();
        
        List<Marks> marksList = marksRepository.findByStudentIdAndDateBetween(student.getId(), startDate, endDate);
        
        // Overall average
        double overallAvg = marksList.isEmpty() ? 0.0 : 
            marksList.stream()
                .mapToDouble(m -> (m.getMarks() / (double) m.getMaxMarks()) * 100)
                .average().orElse(0.0);
        performance.setOverallAverage(overallAvg);
        
        // Subject-wise marks
        Map<String, List<Marks>> subjectMarks = marksList.stream()
            .collect(Collectors.groupingBy(m -> m.getSubject() != null ? m.getSubject() : "Unknown"));
        
        Map<String, StudentDetailedReportDTO.SubjectMarks> subjectWiseMarks = new HashMap<>();
        for (Map.Entry<String, List<Marks>> entry : subjectMarks.entrySet()) {
            StudentDetailedReportDTO.SubjectMarks sm = new StudentDetailedReportDTO.SubjectMarks();
            sm.setSubject(entry.getKey());
            
            List<Double> percentages = entry.getValue().stream()
                .map(m -> (m.getMarks() / (double) m.getMaxMarks()) * 100)
                .collect(Collectors.toList());
            
            sm.setAverage(percentages.stream().mapToDouble(Double::doubleValue).average().orElse(0.0));
            sm.setHighest(percentages.stream().mapToDouble(Double::doubleValue).max().orElse(0.0));
            sm.setLowest(percentages.stream().mapToDouble(Double::doubleValue).min().orElse(0.0));
            
            subjectWiseMarks.put(entry.getKey(), sm);
        }
        performance.setSubjectWiseMarks(subjectWiseMarks);
        
        // Assessment details
        List<StudentDetailedReportDTO.AssessmentDetail> assessments = marksList.stream()
            .map(m -> {
                StudentDetailedReportDTO.AssessmentDetail detail = new StudentDetailedReportDTO.AssessmentDetail();
                detail.setAssessmentType(m.getAssessmentType() != null ? m.getAssessmentType() : "Unknown");
                detail.setSubject(m.getSubject());
                detail.setMarksObtained(m.getMarks());
                detail.setTotalMarks(m.getMaxMarks());
                detail.setPercentage((m.getMarks() / (double) m.getMaxMarks()) * 100);
                detail.setDate(m.getDate());
                return detail;
            })
            .collect(Collectors.toList());
        performance.setAssessments(assessments);
        
        return performance;
    }
    
    private StudentDetailedReportDTO.TaskSubmissionPerformance buildStudentTaskPerformance(User student, LocalDate startDate, LocalDate endDate) {
        StudentDetailedReportDTO.TaskSubmissionPerformance performance = new StudentDetailedReportDTO.TaskSubmissionPerformance();
        
        List<Task> tasks = taskRepository.findAll().stream()
            .filter(t -> t.getAssignedTo() != null && t.getAssignedTo().getId().equals(student.getId()))
            .filter(t -> t.getCreatedAt() != null && 
                        !t.getCreatedAt().toLocalDate().isBefore(startDate) && 
                        !t.getCreatedAt().toLocalDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        int total = tasks.size();
        performance.setTotalTasksAssigned(total);
        
        List<Submission> submissions = tasks.stream()
            .flatMap(t -> submissionRepository.findByTask(t).stream())
            .filter(s -> s.getStudent() != null && s.getStudent().getId().equals(student.getId()))
            .collect(Collectors.toList());
        
        int completed = (int) submissions.stream()
            .filter(s -> "COMPLETED".equals(s.getStatus()))
            .count();
        performance.setCompletedTasks(completed);
        performance.setPendingTasks(total - completed);
        
        int lateSubmissions = (int) submissions.stream()
            .filter(s -> s.getSubmittedAt() != null && s.getTask() != null && s.getTask().getDueDate() != null)
            .filter(s -> s.getSubmittedAt().toLocalDate().isAfter(s.getTask().getDueDate().toLocalDate()))
            .count();
        performance.setLateSubmissions(lateSubmissions);
        
        performance.setCompletionRate(total > 0 ? (completed * 100.0 / total) : 0.0);
        
        // Average time to submit
        double avgDays = submissions.stream()
            .filter(s -> s.getSubmittedAt() != null && s.getTask() != null && s.getTask().getCreatedAt() != null)
            .mapToLong(s -> java.time.temporal.ChronoUnit.DAYS.between(
                s.getTask().getCreatedAt().toLocalDate(), 
                s.getSubmittedAt().toLocalDate()
            ))
            .average().orElse(0.0);
        performance.setAverageTimeToSubmit(avgDays);
        
        return performance;
    }
    
    private StudentDetailedReportDTO.QuizPerformance buildStudentQuizPerformance(User student, LocalDate startDate, LocalDate endDate) {
        StudentDetailedReportDTO.QuizPerformance performance = new StudentDetailedReportDTO.QuizPerformance();
        
        List<Quiz> quizzes = quizRepository.findAll().stream()
            .filter(q -> q.getStartTime() != null &&
                        !q.getStartTime().toLocalDate().isBefore(startDate) &&
                        !q.getStartTime().toLocalDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        performance.setTotalQuizzes(quizzes.size());
        
        List<QuizAttempt> attempts = quizAttemptRepository.findAll().stream()
            .filter(a -> a.getStudent() != null && a.getStudent().getId().equals(student.getId()))
            .filter(a -> quizzes.stream().anyMatch(q -> q.getId().equals(a.getQuiz().getId())))
            .collect(Collectors.toList());
        
        performance.setAttemptedQuizzes(attempts.size());
        
        if (!attempts.isEmpty()) {
            double avgScore = attempts.stream()
                .mapToDouble(QuizAttempt::getScore)
                .average().orElse(0.0);
            performance.setAverageScore(avgScore);
            performance.setHighestScore(attempts.stream().mapToDouble(QuizAttempt::getScore).max().orElse(0.0));
            performance.setLowestScore(attempts.stream().mapToDouble(QuizAttempt::getScore).min().orElse(0.0));
        }
        
        return performance;
    }
    
    private StudentDetailedReportDTO.FeedbackSummary buildStudentFeedbackSummary(User student, LocalDate startDate, LocalDate endDate) {
        StudentDetailedReportDTO.FeedbackSummary summary = new StudentDetailedReportDTO.FeedbackSummary();
        
        List<Feedback> feedbackList = feedbackRepository.findByStudent(student).stream()
            .filter(f -> f.getCreatedAt() != null &&
                        !f.getCreatedAt().toLocalDate().isBefore(startDate) &&
                        !f.getCreatedAt().toLocalDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        summary.setTotalFeedbackReceived(feedbackList.size());
        
        if (!feedbackList.isEmpty()) {
            Feedback latest = feedbackList.stream()
                .max(Comparator.comparing(Feedback::getCreatedAt))
                .orElse(null);
            if (latest != null) {
                summary.setLatestFeedback(latest.getContent());
                summary.setLatestFeedbackDate(latest.getCreatedAt().toLocalDate());
            }
        }
        
        return summary;
    }

    /**
     * Generate faculty performance report for ALL faculty
     * Only HOD can view this report
     */
    public List<FacultyPerformanceReportDTO> generateAllFacultyReport(LocalDate startDate, LocalDate endDate) {
        // Get all users with FACULTY role
        List<User> facultyList = userRepository.findAll().stream()
            .filter(u -> u.getRoles() != null && u.getRoles().stream()
                .anyMatch(r -> ERole.ROLE_FACULTY.equals(r.getName())))
            .sorted((f1, f2) -> f1.getFullName().compareTo(f2.getFullName()))
            .collect(Collectors.toList());
        
        // Generate report for each faculty
        return facultyList.stream()
            .map(faculty -> {
                FacultyPerformanceReportDTO report = new FacultyPerformanceReportDTO();
                report.setFacultyId(faculty.getId());
                report.setFacultyName(faculty.getFullName());
                report.setEmail(faculty.getEmail());
                report.setStartDate(startDate);
                report.setEndDate(endDate);
                
                report.setTaskMetrics(buildFacultyTaskMetrics(faculty, startDate, endDate));
                report.setEngagementMetrics(buildFacultyEngagementMetrics(faculty, startDate, endDate));
                report.setAssessmentMetrics(buildFacultyAssessmentMetrics(faculty, startDate, endDate));
                report.setAttendanceMetrics(buildFacultyAttendanceMetrics(faculty, startDate, endDate));
                report.setFeedbackMetrics(buildFacultyFeedbackMetrics(faculty, startDate, endDate));
                report.setQuizMetrics(buildFacultyQuizMetrics(faculty, startDate, endDate));
                
                return report;
            })
            .collect(Collectors.toList());
    }
    
    private FacultyPerformanceReportDTO.TaskManagementMetrics buildFacultyTaskMetrics(User faculty, LocalDate startDate, LocalDate endDate) {
        FacultyPerformanceReportDTO.TaskManagementMetrics metrics = new FacultyPerformanceReportDTO.TaskManagementMetrics();
        
        List<Task> tasks = taskRepository.findAll().stream()
            .filter(t -> t.getAssignedBy() != null && t.getAssignedBy().getId().equals(faculty.getId()))
            .filter(t -> t.getCreatedAt() != null &&
                        !t.getCreatedAt().toLocalDate().isBefore(startDate) &&
                        !t.getCreatedAt().toLocalDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        // Group by title/subject/dueDate to get unique task assignments
        Map<String, List<Task>> groupedTasks = tasks.stream()
            .collect(Collectors.groupingBy(t -> 
                t.getTitle() + "|" + t.getSubject() + "|" + 
                (t.getDueDate() != null ? t.getDueDate().toString() : "null")
            ));
        
        metrics.setTotalTasksCreated(groupedTasks.size());
        metrics.setTotalTasksAssigned(tasks.size());
        
        // Tasks by subject
        Map<String, Integer> tasksBySubject = tasks.stream()
            .collect(Collectors.groupingBy(
                t -> t.getSubject() != null ? t.getSubject() : "Unknown",
                Collectors.summingInt(t -> 1)
            ));
        metrics.setTasksBySubject(tasksBySubject);
        
        // Average completion rate
        List<Double> completionRates = new ArrayList<>();
        List<FacultyPerformanceReportDTO.TaskSummary> recentTasks = new ArrayList<>();
        
        for (Map.Entry<String, List<Task>> entry : groupedTasks.entrySet()) {
            List<Task> taskGroup = entry.getValue();
            if (taskGroup.isEmpty()) continue;
            
            Task firstTask = taskGroup.get(0);
            int totalStudents = taskGroup.size();
            
            long completedCount = taskGroup.stream()
                .flatMap(t -> submissionRepository.findByTask(t).stream())
                .filter(s -> "COMPLETED".equals(s.getStatus()))
                .count();
            
            double completionRate = totalStudents > 0 ? (completedCount * 100.0 / totalStudents) : 0.0;
            completionRates.add(completionRate);
            
            // Add to recent tasks (limit to 10)
            if (recentTasks.size() < 10) {
                FacultyPerformanceReportDTO.TaskSummary summary = new FacultyPerformanceReportDTO.TaskSummary();
                summary.setTaskId(firstTask.getId());
                summary.setTitle(firstTask.getTitle());
                summary.setSubject(firstTask.getSubject());
                summary.setDueDate(firstTask.getDueDate() != null ? firstTask.getDueDate().toLocalDate() : null);
                summary.setTotalStudents(totalStudents);
                summary.setSubmittedCount((int) completedCount);
                summary.setPendingCount((int) (totalStudents - completedCount));
                summary.setCompletionRate(completionRate);
                recentTasks.add(summary);
            }
        }
        
        metrics.setAverageCompletionRate(
            completionRates.isEmpty() ? 0.0 : 
            completionRates.stream().mapToDouble(Double::doubleValue).average().orElse(0.0)
        );
        metrics.setRecentTasks(recentTasks);
        
        return metrics;
    }
    
    private FacultyPerformanceReportDTO.StudentEngagementMetrics buildFacultyEngagementMetrics(User faculty, LocalDate startDate, LocalDate endDate) {
        FacultyPerformanceReportDTO.StudentEngagementMetrics metrics = new FacultyPerformanceReportDTO.StudentEngagementMetrics();
        
        List<Task> tasks = taskRepository.findAll().stream()
            .filter(t -> t.getAssignedBy() != null && t.getAssignedBy().getId().equals(faculty.getId()))
            .filter(t -> t.getCreatedAt() != null &&
                        !t.getCreatedAt().toLocalDate().isBefore(startDate) &&
                        !t.getCreatedAt().toLocalDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        Set<Long> uniqueStudents = tasks.stream()
            .filter(t -> t.getAssignedTo() != null)
            .map(t -> t.getAssignedTo().getId())
            .collect(Collectors.toSet());
        
        metrics.setTotalStudentsTaught(uniqueStudents.size());
        
        List<Submission> submissions = tasks.stream()
            .flatMap(t -> submissionRepository.findByTask(t).stream())
            .collect(Collectors.toList());
        
        Set<Long> activeStudents = submissions.stream()
            .filter(s -> s.getStudent() != null)
            .map(s -> s.getStudent().getId())
            .collect(Collectors.toSet());
        
        metrics.setActiveStudents(activeStudents.size());
        
        // Average submission time
        double avgDays = submissions.stream()
            .filter(s -> s.getSubmittedAt() != null && s.getTask() != null && s.getTask().getCreatedAt() != null)
            .mapToLong(s -> java.time.temporal.ChronoUnit.DAYS.between(
                s.getTask().getCreatedAt().toLocalDate(),
                s.getSubmittedAt().toLocalDate()
            ))
            .average().orElse(0.0);
        metrics.setAverageSubmissionTime(avgDays);
        
        // Late submissions
        int lateSubmissions = (int) submissions.stream()
            .filter(s -> s.getSubmittedAt() != null && s.getTask() != null && s.getTask().getDueDate() != null)
            .filter(s -> s.getSubmittedAt().toLocalDate().isAfter(s.getTask().getDueDate().toLocalDate()))
            .count();
        metrics.setLateSubmissions(lateSubmissions);
        
        // Student response rate
        int totalAssignments = tasks.size();
        int submittedCount = submissions.size();
        metrics.setStudentResponseRate(totalAssignments > 0 ? (submittedCount * 100.0 / totalAssignments) : 0.0);
        
        return metrics;
    }
    
    private FacultyPerformanceReportDTO.AssessmentMetrics buildFacultyAssessmentMetrics(User faculty, LocalDate startDate, LocalDate endDate) {
        FacultyPerformanceReportDTO.AssessmentMetrics metrics = new FacultyPerformanceReportDTO.AssessmentMetrics();
        
        List<Marks> marksList = marksRepository.findAll().stream()
            .filter(m -> m.getFaculty() != null && m.getFaculty().getId().equals(faculty.getId()))
            .filter(m -> m.getDate() != null &&
                        !m.getDate().isBefore(startDate) &&
                        !m.getDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        metrics.setTotalMarksEntered(marksList.size());
        
        // Subject averages
        Map<String, Double> subjectAverages = marksList.stream()
            .collect(Collectors.groupingBy(
                m -> m.getSubject() != null ? m.getSubject() : "Unknown",
                Collectors.averagingDouble(m -> (m.getMarks() / (double) m.getMaxMarks()) * 100)
            ));
        metrics.setSubjectAverages(subjectAverages);
        
        // Assessment type count
        Map<String, Integer> assessmentTypeCount = marksList.stream()
            .collect(Collectors.groupingBy(
                m -> m.getAssessmentType() != null ? m.getAssessmentType() : "Unknown",
                Collectors.summingInt(m -> 1)
            ));
        metrics.setAssessmentTypeCount(assessmentTypeCount);
        
        // Overall class average
        double overallAvg = marksList.isEmpty() ? 0.0 :
            marksList.stream()
                .mapToDouble(m -> (m.getMarks() / (double) m.getMaxMarks()) * 100)
                .average().orElse(0.0);
        metrics.setOverallClassAverage(overallAvg);
        
        return metrics;
    }
    
    private FacultyPerformanceReportDTO.AttendanceTrackingMetrics buildFacultyAttendanceMetrics(User faculty, LocalDate startDate, LocalDate endDate) {
        FacultyPerformanceReportDTO.AttendanceTrackingMetrics metrics = new FacultyPerformanceReportDTO.AttendanceTrackingMetrics();
        
        List<Attendance> records = attendanceRepository.findAll().stream()
            .filter(a -> a.getFaculty() != null && a.getFaculty().getId().equals(faculty.getId()))
            .filter(a -> a.getDate() != null &&
                        !a.getDate().isBefore(startDate) &&
                        !a.getDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        metrics.setTotalAttendanceRecords(records.size());
        
        // Status distribution
        Map<String, Integer> statusDistribution = records.stream()
            .collect(Collectors.groupingBy(
                a -> a.getStatus() != null ? a.getStatus().name() : "Unknown",
                Collectors.summingInt(a -> 1)
            ));
        metrics.setStatusDistribution(statusDistribution);
        
        // Overall attendance rate
        int present = statusDistribution.getOrDefault("PRESENT", 0);
        int total = records.size();
        metrics.setOverallAttendanceRate(total > 0 ? (present * 100.0 / total) : 0.0);
        
        // Students with low attendance (< 75%)
        Map<Long, List<Attendance>> studentAttendance = records.stream()
            .filter(a -> a.getStudent() != null)
            .collect(Collectors.groupingBy(a -> a.getStudent().getId()));
        
        int lowAttendanceCount = 0;
        for (List<Attendance> studentRecords : studentAttendance.values()) {
            int studentTotal = studentRecords.size();
            int studentPresent = (int) studentRecords.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT)
                .count();
            double attendanceRate = studentTotal > 0 ? (studentPresent * 100.0 / studentTotal) : 0.0;
            if (attendanceRate < 75.0) {
                lowAttendanceCount++;
            }
        }
        metrics.setStudentsWithLowAttendance(lowAttendanceCount);
        
        return metrics;
    }
    
    private FacultyPerformanceReportDTO.FeedbackMetrics buildFacultyFeedbackMetrics(User faculty, LocalDate startDate, LocalDate endDate) {
        FacultyPerformanceReportDTO.FeedbackMetrics metrics = new FacultyPerformanceReportDTO.FeedbackMetrics();
        
        List<Feedback> feedbackList = feedbackRepository.findByFaculty(faculty).stream()
            .filter(f -> f.getCreatedAt() != null &&
                        !f.getCreatedAt().toLocalDate().isBefore(startDate) &&
                        !f.getCreatedAt().toLocalDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        metrics.setTotalFeedbackGiven(feedbackList.size());
        
        // Get unique students who received feedback
        Set<Long> studentsWithFeedback = feedbackList.stream()
            .filter(f -> f.getStudent() != null)
            .map(f -> f.getStudent().getId())
            .collect(Collectors.toSet());
        
        // Get all students taught by this faculty
        Set<Long> allStudents = taskRepository.findAll().stream()
            .filter(t -> t.getAssignedBy() != null && t.getAssignedBy().getId().equals(faculty.getId()))
            .filter(t -> t.getAssignedTo() != null)
            .map(t -> t.getAssignedTo().getId())
            .collect(Collectors.toSet());
        
        int studentsWithoutFeedback = allStudents.size() - studentsWithFeedback.size();
        metrics.setStudentsWithoutFeedback(Math.max(0, studentsWithoutFeedback));
        
        double avgFeedbackPerStudent = allStudents.isEmpty() ? 0.0 : 
            (feedbackList.size() * 1.0 / allStudents.size());
        metrics.setAverageFeedbackPerStudent(avgFeedbackPerStudent);
        
        return metrics;
    }
    
    private FacultyPerformanceReportDTO.QuizMetrics buildFacultyQuizMetrics(User faculty, LocalDate startDate, LocalDate endDate) {
        FacultyPerformanceReportDTO.QuizMetrics metrics = new FacultyPerformanceReportDTO.QuizMetrics();
        
        List<Quiz> quizzes = quizRepository.findAll().stream()
            .filter(q -> q.getFaculty() != null && q.getFaculty().getId().equals(faculty.getId()))
            .filter(q -> q.getStartTime() != null &&
                        !q.getStartTime().toLocalDate().isBefore(startDate) &&
                        !q.getStartTime().toLocalDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        metrics.setTotalQuizzesCreated(quizzes.size());
        
        List<QuizAttempt> attempts = quizzes.stream()
            .flatMap(q -> quizAttemptRepository.findAll().stream()
                .filter(a -> a.getQuiz() != null && a.getQuiz().getId().equals(q.getId())))
            .collect(Collectors.toList());
        
        metrics.setTotalQuizAttempts(attempts.size());
        
        if (!attempts.isEmpty()) {
            double avgScore = attempts.stream()
                .mapToDouble(QuizAttempt::getScore)
                .average().orElse(0.0);
            metrics.setAverageQuizScore(avgScore);
            
            Set<Long> studentsAttempted = attempts.stream()
                .filter(a -> a.getStudent() != null)
                .map(a -> a.getStudent().getId())
                .collect(Collectors.toSet());
            metrics.setStudentsAttemptedQuizzes(studentsAttempted.size());
        }
        
        return metrics;
    }

    /**
     * Generate task-wise report
     * Faculty can see tasks they assigned, HOD can see all tasks with faculty filter
     */
    public List<TaskWiseReportDTO> generateTaskWiseReport(Long facultyId, Long taskId, LocalDate startDate, LocalDate endDate) {
        List<TaskWiseReportDTO> reports = new ArrayList<>();
        
        List<Task> tasks;
        
        if (taskId != null) {
            // Specific task
            Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
            tasks = Arrays.asList(task);
        } else if (facultyId != null) {
            // All tasks by specific faculty
            tasks = taskRepository.findAll().stream()
                .filter(t -> t.getAssignedBy() != null && t.getAssignedBy().getId().equals(facultyId))
                .filter(t -> t.getCreatedAt() != null &&
                            !t.getCreatedAt().toLocalDate().isBefore(startDate) &&
                            !t.getCreatedAt().toLocalDate().isAfter(endDate))
                .collect(Collectors.toList());
        } else {
            // HOD viewing all tasks
            tasks = taskRepository.findAll().stream()
                .filter(t -> t.getCreatedAt() != null &&
                            !t.getCreatedAt().toLocalDate().isBefore(startDate) &&
                            !t.getCreatedAt().toLocalDate().isAfter(endDate))
                .collect(Collectors.toList());
        }
        
        // Group tasks by title/subject/dueDate (same assignment to multiple students)
        Map<String, List<Task>> groupedTasks = tasks.stream()
            .filter(t -> t.getAssignedBy() != null)
            .collect(Collectors.groupingBy(t ->
                t.getTitle() + "|" + t.getSubject() + "|" +
                (t.getDueDate() != null ? t.getDueDate().toString() : "null") + "|" +
                t.getAssignedBy().getId()
            ));
        
        for (Map.Entry<String, List<Task>> entry : groupedTasks.entrySet()) {
            List<Task> taskGroup = entry.getValue();
            if (taskGroup.isEmpty()) continue;
            
            Task firstTask = taskGroup.get(0);
            TaskWiseReportDTO report = new TaskWiseReportDTO();
            
            report.setTaskId(firstTask.getId());
            report.setTaskTitle(firstTask.getTitle());
            report.setSubject(firstTask.getSubject());
            report.setDescription(firstTask.getDescription());
            report.setStartDate(firstTask.getStartDate() != null ? firstTask.getStartDate().toLocalDate() : null);
            report.setDueDate(firstTask.getDueDate() != null ? firstTask.getDueDate().toLocalDate() : null);
            report.setCreatedDate(firstTask.getCreatedAt() != null ? firstTask.getCreatedAt().toLocalDate() : null);
            report.setFacultyId(firstTask.getAssignedBy().getId());
            report.setFacultyName(firstTask.getAssignedBy().getFullName());
            
            // Build metrics
            TaskWiseReportDTO.TaskMetrics metrics = new TaskWiseReportDTO.TaskMetrics();
            List<TaskWiseReportDTO.StudentSubmissionDetail> studentDetails = new ArrayList<>();
            
            int totalStudents = taskGroup.size();
            int submittedCount = 0;
            int completedCount = 0;
            int lateSubmissions = 0;
            int submissionsWithFiles = 0;
            List<Long> submissionTimes = new ArrayList<>();
            
            for (Task task : taskGroup) {
                if (task.getAssignedTo() == null) continue;
                
                User student = task.getAssignedTo();
                List<Submission> submissions = submissionRepository.findByTask(task);
                Submission submission = submissions != null && !submissions.isEmpty() ? submissions.get(0) : null;
                
                TaskWiseReportDTO.StudentSubmissionDetail detail = new TaskWiseReportDTO.StudentSubmissionDetail();
                detail.setStudentId(student.getId());
                detail.setStudentName(student.getFullName());
                detail.setRollNumber(student.getRollNumber());
                
                if (submission != null) {
                    detail.setSubmissionStatus(submission.getStatus() != null ? submission.getStatus() : "PENDING");
                    detail.setSubmittedDate(submission.getSubmittedAt() != null ? submission.getSubmittedAt().toLocalDate() : null);
                    detail.setContent(submission.getContent());
                    detail.setHasFile(submission.getFilePath() != null);
                    detail.setFileName(submission.getFileName());
                    detail.setFacultyRemark(submission.getFacultyRemark());
                    detail.setMarkedCompleteAt(submission.getMarkedCompleteAt() != null ? submission.getMarkedCompleteAt().toLocalDate() : null);
                    
                    if ("COMPLETED".equals(submission.getStatus())) {
                        completedCount++;
                    }
                    if (submission.getSubmittedAt() != null) {
                        submittedCount++;
                        
                        if (submission.getFilePath() != null) {
                            submissionsWithFiles++;
                        }
                        
                        // Check if late
                        if (task.getDueDate() != null && submission.getSubmittedAt().toLocalDate().isAfter(task.getDueDate().toLocalDate())) {
                            detail.setLate(true);
                            lateSubmissions++;
                        }
                        
                        // Calculate days to submit
                        if (task.getCreatedAt() != null) {
                            long days = java.time.temporal.ChronoUnit.DAYS.between(
                                task.getCreatedAt().toLocalDate(),
                                submission.getSubmittedAt().toLocalDate()
                            );
                            detail.setDaysToSubmit((int) days);
                            submissionTimes.add(days);
                        }
                    }
                } else {
                    detail.setSubmissionStatus("PENDING");
                }
                
                studentDetails.add(detail);
            }
            
            metrics.setTotalStudentsAssigned(totalStudents);
            metrics.setSubmittedCount(submittedCount);
            metrics.setPendingCount(totalStudents - submittedCount);
            metrics.setCompletedCount(completedCount);
            metrics.setSubmissionRate(totalStudents > 0 ? (submittedCount * 100.0 / totalStudents) : 0.0);
            metrics.setCompletionRate(totalStudents > 0 ? (completedCount * 100.0 / totalStudents) : 0.0);
            metrics.setLateSubmissions(lateSubmissions);
            metrics.setSubmissionsWithFiles(submissionsWithFiles);
            
            double avgSubmissionTime = submissionTimes.isEmpty() ? 0.0 :
                submissionTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            metrics.setAverageSubmissionTime(avgSubmissionTime);
            
            report.setMetrics(metrics);
            report.setStudentDetails(studentDetails);
            
            reports.add(report);
        }
        
        return reports;
    }
}