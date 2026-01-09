package com.studenttrack.service;

import com.studenttrack.dto.SubmissionOverviewDTO;
import com.studenttrack.dto.SubmissionRequest;
import com.studenttrack.entity.Submission;
import com.studenttrack.entity.Task;
import com.studenttrack.entity.User;
import com.studenttrack.repository.SubmissionRepository;
import com.studenttrack.repository.TaskRepository;
import com.studenttrack.repository.UserRepository;
import com.studenttrack.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    public Submission createSubmission(Long taskId, SubmissionRequest submissionRequest, MultipartFile file) throws Exception {
        UserPrincipal currentUser = authService.getCurrentUser();
        User student = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        Submission submission = new Submission(
                submissionRequest.getContent(),
                task,
                student
        );
        
        // Handle file upload
        if (file != null && !file.isEmpty()) {
            String storedFileName = fileStorageService.storeFile(file);
            submission.setFilePath(storedFileName);
            submission.setFileName(submissionRequest.getFileName());
            submission.setFileSize(submissionRequest.getFileSize());
        }

        // Auto-calculate submission timeliness based on due date
        java.time.LocalDateTime submittedAt = submission.getSubmittedAt();
        java.time.LocalDateTime dueDate = task.getDueDate();
        
        if (dueDate != null && submittedAt != null) {
            if (submittedAt.isAfter(dueDate)) {
                submission.setSubmissionTimeliness("LATE");
            } else {
                submission.setSubmissionTimeliness("ON_TIME");
            }
        } else {
            // Default to ON_TIME if no due date specified
            submission.setSubmissionTimeliness("ON_TIME");
        }

        Submission savedSubmission = submissionRepository.save(submission);
        
        // Send notification and email to faculty
        User faculty = task.getAssignedBy();
        if (faculty != null) {
            String title = "New Submission: " + task.getTitle();
            String message = String.format("%s has submitted work for '%s'",
                student.getFullName(), task.getTitle());
            
            notificationService.createNotification(
                faculty, title, message,
                com.studenttrack.entity.Notification.NotificationType.SUBMISSION_RECEIVED,
                savedSubmission.getId()
            );
            
            emailService.sendSubmissionReceivedEmail(
                faculty.getEmail(),
                faculty.getFullName(),
                student.getFullName(),
                task.getTitle()
            );
        }
        
        return savedSubmission;
    }

    public List<Submission> getSubmissionsByTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        return submissionRepository.findByTask(task);
    }

    public List<Submission> getSubmissionsByStudent() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User student = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return submissionRepository.findByStudent(student);
    }

    public List<Submission> getSubmissionsByFaculty() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return submissionRepository.findByTaskAssignedBy(faculty);
    }

    public Optional<Submission> getSubmissionById(Long submissionId) {
        return submissionRepository.findById(submissionId);
    }

    public List<SubmissionOverviewDTO> getAllSubmissionsForHOD() {
        List<Submission> allSubmissions = submissionRepository.findAll();
        
        return allSubmissions.stream().map(submission -> {
            SubmissionOverviewDTO dto = new SubmissionOverviewDTO();
            dto.setSubmissionId(submission.getId());
            dto.setSubmissionContent(submission.getContent());
            dto.setSubmittedAt(submission.getSubmittedAt());
            dto.setFileName(submission.getFileName());
            dto.setFileSize(submission.getFileSize());
            
            Task task = submission.getTask();
            dto.setTaskTitle(task.getTitle());
            dto.setTaskSubject(task.getSubject());
            
            User student = submission.getStudent();
            dto.setStudentId(student.getId());
            dto.setStudentName(student.getFullName());
            dto.setStudentRollNumber(student.getRollNumber());
            
            User faculty = task.getAssignedBy();
            dto.setFacultyId(faculty.getId());
            dto.setFacultyName(faculty.getFullName());
            
            dto.setStatus(submission.getStatus());
            dto.setSubmissionTimeliness(submission.getSubmissionTimeliness());
            dto.setFacultyRemark(submission.getFacultyRemark());
            dto.setMarkedCompleteAt(submission.getMarkedCompleteAt());
            
            return dto;
        }).collect(Collectors.toList());
    }

    public Map<String, Map<String, List<SubmissionOverviewDTO>>> getSubmissionsGroupedByFacultyAndSubject() {
        List<SubmissionOverviewDTO> allSubmissions = getAllSubmissionsForHOD();
        
        Map<String, Map<String, List<SubmissionOverviewDTO>>> grouped = new HashMap<>();
        
        for (SubmissionOverviewDTO submission : allSubmissions) {
            String facultyName = submission.getFacultyName();
            String subject = submission.getTaskSubject() != null ? submission.getTaskSubject() : "General";
            
            grouped.putIfAbsent(facultyName, new HashMap<>());
            grouped.get(facultyName).putIfAbsent(subject, new ArrayList<>());
            grouped.get(facultyName).get(subject).add(submission);
        }
        
        return grouped;
    }

    public List<SubmissionOverviewDTO> getSubmissionsByStudentAsDTO() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User student = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Submission> submissions = submissionRepository.findByStudent(student);
        return submissions.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<SubmissionOverviewDTO> getSubmissionsByFacultyAsDTO() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Submission> submissions = submissionRepository.findByTaskAssignedBy(faculty);
        return submissions.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private SubmissionOverviewDTO convertToDTO(Submission submission) {
        SubmissionOverviewDTO dto = new SubmissionOverviewDTO();
        dto.setSubmissionId(submission.getId());
        dto.setSubmissionContent(submission.getContent());
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setFileName(submission.getFileName());
        dto.setFileSize(submission.getFileSize());
        
        Task task = submission.getTask();
        dto.setTaskId(task.getId());
        dto.setTaskTitle(task.getTitle());
        dto.setTaskSubject(task.getSubject());
        
        User student = submission.getStudent();
        dto.setStudentId(student.getId());
        dto.setStudentName(student.getFullName());
        dto.setStudentRollNumber(student.getRollNumber());
        
        User faculty = task.getAssignedBy();
        dto.setFacultyId(faculty.getId());
        dto.setFacultyName(faculty.getFullName());
        
        dto.setStatus(submission.getStatus());
        dto.setSubmissionTimeliness(submission.getSubmissionTimeliness());
        dto.setFacultyRemark(submission.getFacultyRemark());
        dto.setMarkedCompleteAt(submission.getMarkedCompleteAt());
        
        return dto;
    }

    public Submission markAsComplete(Long submissionId, String remark) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        
        // Verify that the faculty is assigned to this task
        if (!submission.getTask().getAssignedBy().getId().equals(faculty.getId())) {
            throw new RuntimeException("You are not authorized to mark this submission as complete");
        }
        
        submission.setStatus("COMPLETED");
        submission.setFacultyRemark(remark);
        submission.setMarkedCompleteAt(java.time.LocalDateTime.now());
        
        return submissionRepository.save(submission);
    }

    public List<com.studenttrack.dto.TaskStudentSubmissionDTO> getTaskStudentsWithSubmissionStatus(String taskTitle) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get all tasks with same title assigned by this faculty
        List<Task> allTasksByFaculty = taskRepository.findByAssignedBy(faculty);
        
        if (allTasksByFaculty.isEmpty()) {
            throw new RuntimeException("No tasks found assigned by you");
        }
        
        List<Task> allTaskVariants = allTasksByFaculty
                .stream()
                .filter(t -> t.getTitle() != null && t.getTitle().equals(taskTitle))
                .collect(java.util.stream.Collectors.toList());
        
        if (allTaskVariants.isEmpty()) {
            throw new RuntimeException("No tasks found with title: " + taskTitle + ". Please check if the task title matches exactly.");
        }
        
        List<com.studenttrack.dto.TaskStudentSubmissionDTO> result = new java.util.ArrayList<>();
        
        // For each task variant (student), check if they have a submission
        for (Task taskVariant : allTaskVariants) {
            com.studenttrack.dto.TaskStudentSubmissionDTO dto = new com.studenttrack.dto.TaskStudentSubmissionDTO();
            
            User student = taskVariant.getAssignedTo();
            dto.setStudentId(student.getId());
            dto.setStudentName(student.getFullName());
            dto.setStudentRollNumber(student.getRollNumber());
            dto.setTaskId(taskVariant.getId());
            dto.setTaskTitle(taskVariant.getTitle());
            
            // Check if student has submitted
            List<Submission> submissions = submissionRepository.findByTaskAndStudent(taskVariant, student);
            
            if (!submissions.isEmpty()) {
                // Get the latest submission (most recent by submittedAt)
                Submission submission = submissions.stream()
                    .max((s1, s2) -> {
                        if (s1.getSubmittedAt() == null && s2.getSubmittedAt() == null) return 0;
                        if (s1.getSubmittedAt() == null) return -1;
                        if (s2.getSubmittedAt() == null) return 1;
                        return s1.getSubmittedAt().compareTo(s2.getSubmittedAt());
                    })
                    .orElse(submissions.get(0));
                dto.setHasSubmission(true);
                dto.setSubmissionId(submission.getId());
                dto.setSubmissionContent(submission.getContent() != null ? submission.getContent() : "");
                dto.setSubmittedAt(submission.getSubmittedAt());
                dto.setFileName(submission.getFileName());
                dto.setFileSize(submission.getFileSize());
                dto.setSubmissionStatus(submission.getStatus() != null ? submission.getStatus() : "PENDING");
                dto.setFacultyRemark(submission.getFacultyRemark());
            } else {
                dto.setHasSubmission(false);
                dto.setSubmissionStatus("NOT_SUBMITTED");
            }
            
            result.add(dto);
        }
        
        // Sort by roll number
        result.sort((a, b) -> {
            String rollA = a.getStudentRollNumber() != null ? a.getStudentRollNumber() : "";
            String rollB = b.getStudentRollNumber() != null ? b.getStudentRollNumber() : "";
            return rollA.compareTo(rollB);
        });
        
        return result;
    }

    public List<com.studenttrack.dto.TaskStudentSubmissionDTO> getTaskStudentsWithSubmissionStatusForHOD(Long facultyId, String taskTitle) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
        
        // Get all tasks with same title assigned by this faculty
        List<Task> allTasksByFaculty = taskRepository.findByAssignedBy(faculty);
        
        if (allTasksByFaculty.isEmpty()) {
            throw new RuntimeException("No tasks found assigned by this faculty");
        }
        
        List<Task> allTaskVariants = allTasksByFaculty
                .stream()
                .filter(t -> t.getTitle() != null && t.getTitle().equals(taskTitle))
                .collect(java.util.stream.Collectors.toList());
        
        if (allTaskVariants.isEmpty()) {
            throw new RuntimeException("No tasks found with title: " + taskTitle + ". Please check if the task title matches exactly.");
        }
        
        List<com.studenttrack.dto.TaskStudentSubmissionDTO> result = new java.util.ArrayList<>();
        
        // For each task variant (student), check if they have a submission
        for (Task taskVariant : allTaskVariants) {
            com.studenttrack.dto.TaskStudentSubmissionDTO dto = new com.studenttrack.dto.TaskStudentSubmissionDTO();
            
            User student = taskVariant.getAssignedTo();
            dto.setStudentId(student.getId());
            dto.setStudentName(student.getFullName());
            dto.setStudentRollNumber(student.getRollNumber());
            dto.setTaskId(taskVariant.getId());
            dto.setTaskTitle(taskVariant.getTitle());
            
            // Check if student has submitted
            List<Submission> submissions = submissionRepository.findByTaskAndStudent(taskVariant, student);
            
            if (!submissions.isEmpty()) {
                // Get the latest submission (most recent by submittedAt)
                Submission submission = submissions.stream()
                    .max((s1, s2) -> {
                        if (s1.getSubmittedAt() == null && s2.getSubmittedAt() == null) return 0;
                        if (s1.getSubmittedAt() == null) return -1;
                        if (s2.getSubmittedAt() == null) return 1;
                        return s1.getSubmittedAt().compareTo(s2.getSubmittedAt());
                    })
                    .orElse(submissions.get(0));
                dto.setHasSubmission(true);
                dto.setSubmissionId(submission.getId());
                dto.setSubmissionContent(submission.getContent() != null ? submission.getContent() : "");
                dto.setSubmittedAt(submission.getSubmittedAt());
                dto.setFileName(submission.getFileName());
                dto.setFileSize(submission.getFileSize());
                dto.setSubmissionStatus(submission.getStatus() != null ? submission.getStatus() : "PENDING");
                dto.setFacultyRemark(submission.getFacultyRemark());
            } else {
                dto.setHasSubmission(false);
                dto.setSubmissionStatus("NOT_SUBMITTED");
            }
            
            result.add(dto);
        }
        
        // Sort by roll number
        result.sort((a, b) -> {
            String rollA = a.getStudentRollNumber() != null ? a.getStudentRollNumber() : "";
            String rollB = b.getStudentRollNumber() != null ? b.getStudentRollNumber() : "";
            return rollA.compareTo(rollB);
        });
        
        return result;
    }
}