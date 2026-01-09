package com.studenttrack.controller;

import com.studenttrack.dto.SubmissionOverviewDTO;
import com.studenttrack.dto.SubmissionRequest;
import com.studenttrack.entity.Submission;
import com.studenttrack.service.SubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;

    @PostMapping(value = "/task/{taskId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createSubmission(
            @PathVariable Long taskId,
            @RequestParam("content") String content,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new com.studenttrack.dto.MessageResponse("Content is required"));
            }
            
            SubmissionRequest submissionRequest = new SubmissionRequest();
            submissionRequest.setContent(content);
            
            if (file != null && !file.isEmpty()) {
                submissionRequest.setFileName(file.getOriginalFilename());
                submissionRequest.setFileSize(file.getSize());
            }
            
            submissionService.createSubmission(taskId, submissionRequest, file);
            return ResponseEntity.ok(new com.studenttrack.dto.MessageResponse("Submission created successfully!"));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new com.studenttrack.dto.MessageResponse(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new com.studenttrack.dto.MessageResponse("Error creating submission: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{submissionId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long submissionId) {
        try {
            Optional<Submission> submissionOpt = submissionService.getSubmissionById(submissionId);
            
            if (submissionOpt.isEmpty() || submissionOpt.get().getFilePath() == null) {
                return ResponseEntity.notFound().build();
            }
            
            Submission submission = submissionOpt.get();
            File file = new File("uploads/" + submission.getFilePath());
            Resource resource = new FileSystemResource(file);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + submission.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<Submission>> getSubmissionsByTask(@PathVariable Long taskId) {
        try {
            List<Submission> submissions = submissionService.getSubmissionsByTask(taskId);
            return ResponseEntity.ok(submissions);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/my-submissions")
//    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<SubmissionOverviewDTO>> getMySubmissions() {
        List<SubmissionOverviewDTO> submissions = submissionService.getSubmissionsByStudentAsDTO();
        return ResponseEntity.ok(submissions);
    }

    @GetMapping("/faculty-submissions")
    public ResponseEntity<List<SubmissionOverviewDTO>> getFacultySubmissions() {
        List<SubmissionOverviewDTO> submissions = submissionService.getSubmissionsByFacultyAsDTO();
        return ResponseEntity.ok(submissions);
    }

    @GetMapping("/{submissionId}")
    public ResponseEntity<?> getSubmissionById(@PathVariable Long submissionId) {
        Optional<Submission> submission = submissionService.getSubmissionById(submissionId);
        if (submission.isPresent()) {
            return ResponseEntity.ok(submission.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/hod-overview")
    public ResponseEntity<?> getAllSubmissionsForHOD() {
        try {
            List<SubmissionOverviewDTO> submissions = submissionService.getAllSubmissionsForHOD();
            return ResponseEntity.ok(submissions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching submissions: " + e.getMessage());
        }
    }

    @GetMapping("/hod-grouped")
    public ResponseEntity<?> getSubmissionsGroupedByFacultyAndSubject() {
        try {
            java.util.Map<String, java.util.Map<String, List<SubmissionOverviewDTO>>> grouped = submissionService.getSubmissionsGroupedByFacultyAndSubject();
            return ResponseEntity.ok(grouped);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching submissions: " + e.getMessage());
        }
    }

    @GetMapping("/faculty-submissions/export")
    public ResponseEntity<String> exportFacultySubmissions() {
        try {
            List<SubmissionOverviewDTO> submissions = submissionService.getSubmissionsByFacultyAsDTO();
            
            // Group submissions by task
            java.util.Map<String, java.util.List<SubmissionOverviewDTO>> taskGroups = new java.util.HashMap<>();
            for (SubmissionOverviewDTO submission : submissions) {
                String taskKey = submission.getTaskTitle() + " (" + submission.getTaskSubject() + ")";
                taskGroups.putIfAbsent(taskKey, new java.util.ArrayList<>());
                taskGroups.get(taskKey).add(submission);
            }
            
            // Create CSV content with task-wise grouping
            StringBuilder csv = new StringBuilder();
            csv.append("STUDENT SUBMISSIONS REPORT\n");
            csv.append("Exported on: ").append(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n");
            csv.append("Total Submissions: ").append(submissions.size()).append("\n");
            csv.append("Total Tasks: ").append(taskGroups.size()).append("\n");
            csv.append("\n");
            
            for (java.util.Map.Entry<String, java.util.List<SubmissionOverviewDTO>> entry : taskGroups.entrySet()) {
                String taskName = entry.getKey();
                java.util.List<SubmissionOverviewDTO> taskSubmissions = entry.getValue();
                
                // Task header
                csv.append("\n").append("=").append("=").append("=").append("=").append("=").append("=").append("=").append("=").append("=").append("\n");
                csv.append("TASK: ").append(escapeCsv(taskName)).append("\n");
                csv.append("=").append("=").append("=").append("=").append("=").append("=").append("=").append("=").append("=").append("\n");
                csv.append("Student Name,Submission Content,Submitted Date,File Name,File Size\n");
                
                // Submissions for this task
                for (SubmissionOverviewDTO submission : taskSubmissions) {
                    csv.append(escapeCsv(submission.getStudentName())).append(",")
                        .append(escapeCsv(submission.getSubmissionContent())).append(",")
                        .append(submission.getSubmittedAt() != null ? submission.getSubmittedAt().toString() : "").append(",")
                        .append(escapeCsv(submission.getFileName() != null ? submission.getFileName() : "")).append(",")
                        .append(submission.getFileSize() != null ? submission.getFileSize().toString() : "")
                        .append("\n");
                }
                csv.append("Total submissions for this task: ").append(taskSubmissions.size()).append("\n");
                csv.append("\n");
            }
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=faculty_submissions_" + java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv")
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(csv.toString());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error exporting submissions: " + e.getMessage());
        }
    }
    
    private String escapeCsv(String value) {
        if (value == null) return "";
        // Escape quotes and wrap in quotes if contains comma or quote
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    @PutMapping("/{submissionId}/mark-complete")
    public ResponseEntity<?> markAsComplete(
            @PathVariable Long submissionId,
            @RequestBody(required = false) java.util.Map<String, String> request) {
        try {
            String remark = request != null ? request.get("remark") : null;
            submissionService.markAsComplete(submissionId, remark);
            return ResponseEntity.ok(new com.studenttrack.dto.MessageResponse("Submission marked as complete successfully!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new com.studenttrack.dto.MessageResponse(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new com.studenttrack.dto.MessageResponse("Error marking submission as complete: " + e.getMessage()));
        }
    }

    @GetMapping("/task/students")
    public ResponseEntity<?> getTaskStudentsWithSubmissionStatus(@RequestParam String taskTitle) {
        try {
            String decodedTaskTitle = java.net.URLDecoder.decode(taskTitle, "UTF-8");
            List<com.studenttrack.dto.TaskStudentSubmissionDTO> students = submissionService.getTaskStudentsWithSubmissionStatus(decodedTaskTitle);
            return ResponseEntity.ok(students);
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new com.studenttrack.dto.MessageResponse(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new com.studenttrack.dto.MessageResponse("Error fetching students: " + e.getMessage()));
        }
    }

    @GetMapping("/hod/task/students")
    public ResponseEntity<?> getHODTaskStudentsWithSubmissionStatus(
            @RequestParam Long facultyId,
            @RequestParam String taskTitle) {
        try {
            String decodedTaskTitle = java.net.URLDecoder.decode(taskTitle, "UTF-8");
            List<com.studenttrack.dto.TaskStudentSubmissionDTO> students = submissionService.getTaskStudentsWithSubmissionStatusForHOD(facultyId, decodedTaskTitle);
            return ResponseEntity.ok(students);
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new com.studenttrack.dto.MessageResponse(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new com.studenttrack.dto.MessageResponse("Error fetching students: " + e.getMessage()));
        }
    }
}