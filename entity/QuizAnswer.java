package com.studenttrack.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "quiz_answers")
public class QuizAnswer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempt attempt;
    
    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;
    
    @Column(name = "selected_option_id")
    private Long selectedOptionId;
    
    @Column(name = "is_correct")
    private Boolean isCorrect;
    
    public QuizAnswer() {}
    
    public QuizAnswer(QuizAttempt attempt, QuizQuestion question, Long selectedOptionId, Boolean isCorrect) {
        this.attempt = attempt;
        this.question = question;
        this.selectedOptionId = selectedOptionId;
        this.isCorrect = isCorrect;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public QuizAttempt getAttempt() {
        return attempt;
    }
    
    public void setAttempt(QuizAttempt attempt) {
        this.attempt = attempt;
    }
    
    public QuizQuestion getQuestion() {
        return question;
    }
    
    public void setQuestion(QuizQuestion question) {
        this.question = question;
    }
    
    public Long getSelectedOptionId() {
        return selectedOptionId;
    }
    
    public void setSelectedOptionId(Long selectedOptionId) {
        this.selectedOptionId = selectedOptionId;
    }
    
    public Boolean getIsCorrect() {
        return isCorrect;
    }
    
    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }
}
