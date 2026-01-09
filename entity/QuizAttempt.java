package com.studenttrack.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_attempts", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"quiz_id", "student_id"})
})
public class QuizAttempt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;
    
    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;
    
    @Column(name = "score")
    private Integer score;
    
    @Column(name = "total_marks")
    private Integer totalMarks;
    
    @Column(name = "attempted_at")
    private LocalDateTime attemptedAt;
    
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
    
    @Column(name = "status")
    private String status; // SUBMITTED, GRADED
    
    public QuizAttempt() {}
    
    public QuizAttempt(Quiz quiz, User student, Integer score, Integer totalMarks) {
        this.quiz = quiz;
        this.student = student;
        this.score = score;
        this.totalMarks = totalMarks;
        this.attemptedAt = LocalDateTime.now();
        this.submittedAt = LocalDateTime.now();
        this.status = "GRADED";
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Quiz getQuiz() {
        return quiz;
    }
    
    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
    }
    
    public User getStudent() {
        return student;
    }
    
    public void setStudent(User student) {
        this.student = student;
    }
    
    public Integer getScore() {
        return score;
    }
    
    public void setScore(Integer score) {
        this.score = score;
    }
    
    public Integer getTotalMarks() {
        return totalMarks;
    }
    
    public void setTotalMarks(Integer totalMarks) {
        this.totalMarks = totalMarks;
    }
    
    public LocalDateTime getAttemptedAt() {
        return attemptedAt;
    }
    
    public void setAttemptedAt(LocalDateTime attemptedAt) {
        this.attemptedAt = attemptedAt;
    }
    
    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }
    
    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
}
