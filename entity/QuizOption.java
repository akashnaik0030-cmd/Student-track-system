package com.studenttrack.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "quiz_options")
public class QuizOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(columnDefinition = "TEXT")
    private String optionText;
    
    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    @JsonIgnore
    private QuizQuestion question;

    // Transient field to accept incoming JSON flag for correct option without DB migration
    @Transient
    @JsonProperty("isCorrect")
    private Boolean correct;

    public Boolean getCorrect() {
        return correct;
    }

    public void setCorrect(Boolean correct) {
        this.correct = correct;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOptionText() {
        return optionText;
    }

    public void setOptionText(String optionText) {
        this.optionText = optionText;
    }

    public QuizQuestion getQuestion() {
        return question;
    }

    public void setQuestion(QuizQuestion question) {
        this.question = question;
    }
}