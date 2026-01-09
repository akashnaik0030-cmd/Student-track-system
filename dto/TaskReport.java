package com.studenttrack.dto;

import java.util.List;

public class TaskReport {
    private List<TaskSubmissionDTO> recentSubmissions;
    private int totalTasks;
    private int completedTasks;
    private int pendingTasks;
    private int lateTasks;

    public List<TaskSubmissionDTO> getRecentSubmissions() {
        return recentSubmissions;
    }

    public void setRecentSubmissions(List<TaskSubmissionDTO> recentSubmissions) {
        this.recentSubmissions = recentSubmissions;
    }

    public int getTotalTasks() {
        return totalTasks;
    }

    public void setTotalTasks(int totalTasks) {
        this.totalTasks = totalTasks;
    }

    public int getCompletedTasks() {
        return completedTasks;
    }

    public void setCompletedTasks(int completedTasks) {
        this.completedTasks = completedTasks;
    }

    public int getPendingTasks() {
        return pendingTasks;
    }

    public void setPendingTasks(int pendingTasks) {
        this.pendingTasks = pendingTasks;
    }

    public int getLateTasks() {
        return lateTasks;
    }

    public void setLateTasks(int lateTasks) {
        this.lateTasks = lateTasks;
    }
}