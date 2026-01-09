package com.studenttrack.controller;

import com.studenttrack.dto.QuizDTO;
import com.studenttrack.dto.QuizAttemptDTO;
import com.studenttrack.entity.Quiz;
import com.studenttrack.service.QuizService;
import com.studenttrack.dto.QuizSubmission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/quiz")
public class QuizController {
    
    @Autowired
    private QuizService quizService;

    @PostMapping
    public ResponseEntity<?> createQuiz(@RequestBody Quiz quiz) {
        try {
            Quiz createdQuiz = quizService.createQuiz(quiz);
            return ResponseEntity.ok(createdQuiz);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating quiz: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getQuiz(@PathVariable Long id) {
        try {
            QuizDTO quiz = quizService.getQuiz(id);
            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching quiz: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllQuizzes() {
        try {
            List<QuizDTO> quizzes = quizService.getAllQuizzes();
            return ResponseEntity.ok(quizzes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching quizzes: " + e.getMessage());
        }
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<?> getQuizzesByFaculty(@PathVariable Long facultyId) {
        try {
            List<QuizDTO> quizzes = quizService.getQuizzesByFaculty(facultyId);
            return ResponseEntity.ok(quizzes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching quizzes: " + e.getMessage());
        }
    }

    @PostMapping("/{quizId}/submit")
    public ResponseEntity<?> submitQuiz(
            @PathVariable Long quizId,
            @RequestParam Long studentId,
            @RequestBody List<QuizSubmission> submissions) {
        try {
            if (!quizService.isQuizAvailable(quizId)) {
                return ResponseEntity.badRequest().body("Quiz is not available or has expired");
            }
            QuizAttemptDTO attempt = quizService.submitQuiz(quizId, studentId, submissions);
            return ResponseEntity.ok(attempt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error submitting quiz: " + e.getMessage());
        }
    }

    @GetMapping("/{quizId}/available")
    public ResponseEntity<?> isQuizAvailable(@PathVariable Long quizId) {
        try {
            boolean isAvailable = quizService.isQuizAvailable(quizId);
            return ResponseEntity.ok(isAvailable);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error checking quiz availability: " + e.getMessage());
        }
    }

    @GetMapping("/{quizId}/attempted")
    public ResponseEntity<?> hasAttempted(@PathVariable Long quizId, @RequestParam Long studentId) {
        try {
            boolean attempted = quizService.hasAttempted(quizId, studentId);
            return ResponseEntity.ok(attempted);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error checking attempt status: " + e.getMessage());
        }
    }

    @GetMapping("/{quizId}/my-attempt")
    public ResponseEntity<?> getMyAttempt(@PathVariable Long quizId) {
        try {
            QuizAttemptDTO attempt = quizService.getMyAttempt(quizId);
            return ResponseEntity.ok(attempt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attempt: " + e.getMessage());
        }
    }

    @GetMapping("/{quizId}/attempts")
    public ResponseEntity<?> getQuizAttempts(@PathVariable Long quizId) {
        try {
            List<QuizAttemptDTO> attempts = quizService.getQuizAttempts(quizId);
            return ResponseEntity.ok(attempts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attempts: " + e.getMessage());
        }
    }

    @GetMapping("/my-attempts")
    public ResponseEntity<?> getMyAttempts() {
        try {
            List<QuizAttemptDTO> attempts = quizService.getMyAttempts();
            return ResponseEntity.ok(attempts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attempts: " + e.getMessage());
        }
    }

    @GetMapping("/attempts/{attemptId}/answers")
    public ResponseEntity<?> getAttemptAnswers(@PathVariable Long attemptId) {
        try {
            List<com.studenttrack.dto.QuizAnswerDTO> answers = quizService.getAttemptAnswers(attemptId);
            return ResponseEntity.ok(answers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching answers: " + e.getMessage());
        }
    }

    @GetMapping("/{quizId}/all-students-status")
    public ResponseEntity<?> getAllStudentsStatus(@PathVariable Long quizId) {
        try {
            List<com.studenttrack.dto.StudentQuizStatusDTO> studentStatuses = quizService.getAllStudentsStatusForQuiz(quizId);
            return ResponseEntity.ok(studentStatuses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching student statuses: " + e.getMessage());
        }
    }
}