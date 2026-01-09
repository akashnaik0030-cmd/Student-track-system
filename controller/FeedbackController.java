package com.studenttrack.controller;

import com.studenttrack.dto.FeedbackDTO;
import com.studenttrack.dto.FeedbackRequest;
import com.studenttrack.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping("/task/{taskId}/student/{studentId}")
//    @PreAuthorize("hasRole('FACULTY') or hasRole('HOD')")
    public ResponseEntity<?> createFeedback(@PathVariable Long taskId, @PathVariable Long studentId, @Valid @RequestBody FeedbackRequest feedbackRequest) {
        try {
            FeedbackDTO feedback = feedbackService.createFeedback(taskId, studentId, feedbackRequest);
            return ResponseEntity.ok(feedback);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<FeedbackDTO>> getFeedbackByTask(@PathVariable Long taskId) {
        try {
            List<FeedbackDTO> feedbacks = feedbackService.getFeedbackByTask(taskId);
            return ResponseEntity.ok(feedbacks);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<FeedbackDTO>> getFeedbackByStudent(@PathVariable Long studentId) {
        try {
            List<FeedbackDTO> feedbacks = feedbackService.getFeedbackByStudent(studentId);
            return ResponseEntity.ok(feedbacks);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/my-feedback")
//    @PreAuthorize("hasRole('FACULTY') or hasRole('HOD')")
    public ResponseEntity<List<FeedbackDTO>> getMyFeedback() {
        List<FeedbackDTO> feedbacks = feedbackService.getFeedbackByFaculty();
        return ResponseEntity.ok(feedbacks);
    }

    @GetMapping("/{feedbackId}")
    public ResponseEntity<?> getFeedbackById(@PathVariable Long feedbackId) {
        try {
            FeedbackDTO feedback = feedbackService.getFeedbackById(feedbackId);
            return ResponseEntity.ok(feedback);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}