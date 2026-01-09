package com.studenttrack.dto;

import java.util.List;

public class TaskReportDTO {
    private Integer totalTasks;
    private Integer completedTasks;
    private Integer pendingTasks;
    private Integer lateTasks;
    private Double completionRate;
    private List<TaskSubmissionDTO> recentSubmissions;

    public Integer getTotalTasks() {
        return totalTasks;
    }

    public void setTotalTasks(Integer totalTasks) {
        this.totalTasks = totalTasks;
    }

    public Integer getCompletedTasks() {
        return completedTasks;
    }

    public void setCompletedTasks(Integer completedTasks) {
        this.completedTasks = completedTasks;
    }

    public Integer getPendingTasks() {
        return pendingTasks;
    }

    public void setPendingTasks(Integer pendingTasks) {
        this.pendingTasks = pendingTasks;
    }

    public Integer getLateTasks() {
        return lateTasks;
    }

    public void setLateTasks(Integer lateTasks) {
        this.lateTasks = lateTasks;
    }

    public Double getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(Double completionRate) {
        this.completionRate = completionRate;
    }

    public List<TaskSubmissionDTO> getRecentSubmissions() {
        return recentSubmissions;
    }

    public void setRecentSubmissions(List<TaskSubmissionDTO> recentSubmissions) {
        this.recentSubmissions = recentSubmissions;
    }
}