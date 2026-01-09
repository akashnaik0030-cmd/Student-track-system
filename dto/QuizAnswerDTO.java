package com.studenttrack.dto;

public class QuizAnswerDTO {
    private Long id;
    private Long questionId;
    private String questionText;
    private Long selectedOptionId;
    private String selectedOptionText;
    private Long correctOptionId;
    private String correctOptionText;
    private Boolean isCorrect;
    private Integer marks;
    
    public QuizAnswerDTO() {}
    
    public QuizAnswerDTO(Long id, Long questionId, String questionText, 
                        Long selectedOptionId, String selectedOptionText,
                        Long correctOptionId, String correctOptionText,
                        Boolean isCorrect, Integer marks) {
        this.id = id;
        this.questionId = questionId;
        this.questionText = questionText;
        this.selectedOptionId = selectedOptionId;
        this.selectedOptionText = selectedOptionText;
        this.correctOptionId = correctOptionId;
        this.correctOptionText = correctOptionText;
        this.isCorrect = isCorrect;
        this.marks = marks;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getQuestionId() {
        return questionId;
    }
    
    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }
    
    public String getQuestionText() {
        return questionText;
    }
    
    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }
    
    public Long getSelectedOptionId() {
        return selectedOptionId;
    }
    
    public void setSelectedOptionId(Long selectedOptionId) {
        this.selectedOptionId = selectedOptionId;
    }
    
    public String getSelectedOptionText() {
        return selectedOptionText;
    }
    
    public void setSelectedOptionText(String selectedOptionText) {
        this.selectedOptionText = selectedOptionText;
    }
    
    public Long getCorrectOptionId() {
        return correctOptionId;
    }
    
    public void setCorrectOptionId(Long correctOptionId) {
        this.correctOptionId = correctOptionId;
    }
    
    public String getCorrectOptionText() {
        return correctOptionText;
    }
    
    public void setCorrectOptionText(String correctOptionText) {
        this.correctOptionText = correctOptionText;
    }
    
    public Boolean getIsCorrect() {
        return isCorrect;
    }
    
    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }
    
    public Integer getMarks() {
        return marks;
    }
    
    public void setMarks(Integer marks) {
        this.marks = marks;
    }
}
