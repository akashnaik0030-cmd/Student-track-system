package com.studenttrack.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

@Entity
@Table(name = "quizzes")
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne
    @JoinColumn(name = "faculty_id", nullable = false)
    private User faculty;
    
    @ManyToOne
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;
    
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer totalMarks;
    
    @Column(name = "subject", length = 100)
    private String subject;
    
    @Column(name = "google_form_link", length = 500)
    private String googleFormLink;
    
    @Column(name = "google_form_responses_link", length = 500)
    private String googleFormResponsesLink;
    
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Fetch(FetchMode.SUBSELECT)
    private Set<QuizQuestion> questions = new HashSet<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public User getFaculty() {
        return faculty;
    }

    public void setFaculty(User faculty) {
        this.faculty = faculty;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Integer getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(Integer totalMarks) {
        this.totalMarks = totalMarks;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getGoogleFormLink() {
        return googleFormLink;
    }

    public void setGoogleFormLink(String googleFormLink) {
        this.googleFormLink = googleFormLink;
    }

    public String getGoogleFormResponsesLink() {
        return googleFormResponsesLink;
    }

    public void setGoogleFormResponsesLink(String googleFormResponsesLink) {
        this.googleFormResponsesLink = googleFormResponsesLink;
    }

    public Set<QuizQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(Set<QuizQuestion> questions) {
        this.questions = questions;
    }
}