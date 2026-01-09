package com.studenttrack.dto;

import java.util.List;
import java.util.Map;

public class AcademicReportDTO {
    private Map<String, SubjectPerformanceDTO> subjectPerformance;
    private Double overallAverage;
    private List<AssessmentResultDTO> assessmentResults;

    public Map<String, SubjectPerformanceDTO> getSubjectPerformance() {
        return subjectPerformance;
    }

    public void setSubjectPerformance(Map<String, SubjectPerformanceDTO> subjectPerformance) {
        this.subjectPerformance = subjectPerformance;
    }

    public Double getOverallAverage() {
        return overallAverage;
    }

    public void setOverallAverage(Double overallAverage) {
        this.overallAverage = overallAverage;
    }

    public List<AssessmentResultDTO> getAssessmentResults() {
        return assessmentResults;
    }

    public void setAssessmentResults(List<AssessmentResultDTO> assessmentResults) {
        this.assessmentResults = assessmentResults;
    }
}