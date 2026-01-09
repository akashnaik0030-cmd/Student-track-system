package com.studenttrack.dto;

import java.util.List;

public class QuizQuestionDTO {
    private Long id;
    private String questionText;
    private Integer marks;
    private Long correctOptionId;
    private List<QuizOptionDTO> options;

    public QuizQuestionDTO() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public Integer getMarks() {
        return marks;
    }

    public void setMarks(Integer marks) {
        this.marks = marks;
    }

    public Long getCorrectOptionId() {
        return correctOptionId;
    }

    public void setCorrectOptionId(Long correctOptionId) {
        this.correctOptionId = correctOptionId;
    }

    public List<QuizOptionDTO> getOptions() {
        return options;
    }

    public void setOptions(List<QuizOptionDTO> options) {
        this.options = options;
    }
}
