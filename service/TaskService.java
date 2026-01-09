package com.studenttrack.service;

import com.studenttrack.dto.TaskDTO;
import com.studenttrack.dto.TaskRequest;
import com.studenttrack.entity.Task;
import com.studenttrack.entity.TaskStatus;
import com.studenttrack.entity.User;
import com.studenttrack.repository.TaskRepository;
import com.studenttrack.repository.UserRepository;
import com.studenttrack.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private EmailService emailService;

    public Task createTask(TaskRequest taskRequest) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User assignedBy = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        User assignedTo = userRepository.findById(taskRequest.getAssignedToId())
                .orElseThrow(() -> new RuntimeException("Assigned user not found"));

        Task task = new Task(
                taskRequest.getTitle(),
                taskRequest.getDescription(),
                assignedBy,
                assignedTo,
                taskRequest.getDueDate()
        );

        return taskRepository.save(task);
    }
    
    public List<Task> createTasksForMultipleStudents(TaskRequest taskRequest) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User assignedBy = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Task> createdTasks = new ArrayList<>();
        
        // If assignedToIds is provided, create tasks for multiple students
        if (taskRequest.getAssignedToIds() != null && !taskRequest.getAssignedToIds().isEmpty()) {
            for (Long studentId : taskRequest.getAssignedToIds()) {
                User assignedTo = userRepository.findById(studentId)
                        .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
                
                Task task = new Task(
                        taskRequest.getTitle(),
                        taskRequest.getDescription(),
                        assignedBy,
                        assignedTo,
                        taskRequest.getDueDate() != null ? taskRequest.getDueDate() : null
                );
                
                if (taskRequest.getSubject() != null) {
                task.setSubject(taskRequest.getSubject());
                }
                
                if (taskRequest.getStartDate() != null) {
                task.setStartDate(taskRequest.getStartDate());
                }
                
                Task savedTask = taskRepository.save(task);
                createdTasks.add(savedTask);
                
                // Send email notification to student
                if (assignedTo.getEmail() != null && !assignedTo.getEmail().isEmpty()) {
                    List<String> emails = List.of(assignedTo.getEmail());
                    String dueDate = taskRequest.getDueDate() != null ? taskRequest.getDueDate().toString() : "Not specified";
                    emailService.sendTaskNotification(emails, taskRequest.getTitle(), 
                        taskRequest.getSubject() != null ? taskRequest.getSubject() : "General", 
                        assignedBy.getUsername(), dueDate);
                }
            }
        } else {
            // Fallback to single assignment
            User assignedTo = userRepository.findById(taskRequest.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("Assigned user not found"));
            
            Task task = new Task(
                    taskRequest.getTitle(),
                    taskRequest.getDescription(),
                    assignedBy,
                    assignedTo,
                    taskRequest.getDueDate() != null ? taskRequest.getDueDate() : null
            );
            
            if (taskRequest.getSubject() != null) {
            task.setSubject(taskRequest.getSubject());
            }
            
            if (taskRequest.getStartDate() != null) {
            task.setStartDate(taskRequest.getStartDate());
            }
            
            Task savedTask = taskRepository.save(task);
            createdTasks.add(savedTask);
            
            // Send email notification to student
            if (assignedTo.getEmail() != null && !assignedTo.getEmail().isEmpty()) {
                List<String> emails = List.of(assignedTo.getEmail());
                String dueDate = taskRequest.getDueDate() != null ? taskRequest.getDueDate().toString() : "Not specified";
                emailService.sendTaskNotification(emails, taskRequest.getTitle(), 
                    taskRequest.getSubject() != null ? taskRequest.getSubject() : "General", 
                    assignedBy.getUsername(), dueDate);
            }
        }
        
        return createdTasks;
    }

    public List<TaskDTO> getTasksByAssignedTo() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Task> tasks = taskRepository.findByAssignedToWithUsers(user);
        return tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TaskDTO> getTasksByAssignedBy() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Task> tasks = taskRepository.findByAssignedByWithUsers(user);
        return tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TaskDTO> getTasksByStatus(TaskStatus status) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Task> tasks = taskRepository.findByAssignedToAndStatus(user, status);
        return tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public TaskDTO updateTaskStatus(Long taskId, TaskStatus status) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        task.setStatus(status);
        Task savedTask = taskRepository.save(task);
        return convertToDTO(savedTask);
    }

    public TaskDTO getTaskById(Long taskId) {
        Task task = taskRepository.findByIdWithUsers(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        return convertToDTO(task);
    }

    public List<TaskDTO> getAllTasks() {
        List<Task> tasks = taskRepository.findAllWithUsers();
        return tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TaskDTO> getTasksByFacultyId(Long facultyId) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
        List<Task> tasks = taskRepository.findByAssignedBy(faculty);
        return tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Aggregated tasks for current faculty (group identical task definitions across students)
    public List<com.studenttrack.dto.AggregatedTaskDTO> getAggregatedTasksAssignedByMe() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Task> tasks = taskRepository.findByAssignedByWithUsers(faculty);
        return aggregateTasks(tasks);
    }

    // Aggregated tasks for HOD across all faculty; optional filter by facultyId
    public List<com.studenttrack.dto.AggregatedTaskDTO> getAggregatedTasksAll(Long facultyId) {
        List<Task> tasks;
        if (facultyId != null) {
            User faculty = userRepository.findById(facultyId)
                    .orElseThrow(() -> new RuntimeException("Faculty not found"));
            tasks = taskRepository.findByAssignedByWithUsers(faculty);
        } else {
            tasks = taskRepository.findAllWithUsers();
        }
        return aggregateTasks(tasks);
    }

    private List<com.studenttrack.dto.AggregatedTaskDTO> aggregateTasks(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) return java.util.Collections.emptyList();
        // Group by (assignedById, title, description, subject, dueDate)
        var groups = tasks.stream().collect(Collectors.groupingBy(t -> new GroupKey(
                t.getAssignedBy() != null ? t.getAssignedBy().getId() : null,
                nullSafe(t.getTitle()),
                nullSafe(t.getDescription()),
                nullSafe(t.getSubject()),
                t.getDueDate()
        )));

        List<com.studenttrack.dto.AggregatedTaskDTO> result = new ArrayList<>();
        for (var entry : groups.entrySet()) {
            var list = entry.getValue();
            if (list == null || list.isEmpty()) continue;
            Task first = list.get(0);
            com.studenttrack.dto.AggregatedTaskDTO dto = new com.studenttrack.dto.AggregatedTaskDTO();
            dto.setId(first.getId()); // Add task ID for navigation
            dto.setTitle(first.getTitle());
            dto.setDescription(first.getDescription());
            dto.setSubject(first.getSubject());
            dto.setDueDate(first.getDueDate());
            if (first.getAssignedBy() != null) {
                dto.setAssignedById(first.getAssignedBy().getId());
                dto.setAssignedByFullName(first.getAssignedBy().getFullName());
            }
            dto.setStudentCount(list.size());

            java.util.Map<String, Integer> statusCounts = new HashMap<>();
            for (Task t : list) {
                String status = t.getStatus() != null ? t.getStatus().name() : "PENDING";
                statusCounts.put(status, statusCounts.getOrDefault(status, 0) + 1);
            }
            dto.setStatusCounts(statusCounts);
            result.add(dto);
        }

        // Sort by due date desc then title
        result.sort((a, b) -> {
            if (a.getDueDate() == null && b.getDueDate() == null) return a.getTitle().compareToIgnoreCase(b.getTitle());
            if (a.getDueDate() == null) return 1;
            if (b.getDueDate() == null) return -1;
            int cmp = b.getDueDate().compareTo(a.getDueDate());
            if (cmp != 0) return cmp;
            return a.getTitle().compareToIgnoreCase(b.getTitle());
        });
        return result;
    }

    private String nullSafe(String s) { return s == null ? "" : s; }

    // Helper record for grouping key
    private static class GroupKey {
        Long facultyId; String title; String description; String subject; java.time.LocalDateTime dueDate;
        GroupKey(Long facultyId, String title, String description, String subject, java.time.LocalDateTime dueDate) {
            this.facultyId = facultyId; this.title = title; this.description = description; this.subject = subject; this.dueDate = dueDate;
        }
        @Override public boolean equals(Object o) {
            if (this == o) return true; if (!(o instanceof GroupKey)) return false; GroupKey g = (GroupKey) o;
            return java.util.Objects.equals(facultyId, g.facultyId) &&
                   java.util.Objects.equals(title, g.title) &&
                   java.util.Objects.equals(description, g.description) &&
                   java.util.Objects.equals(subject, g.subject) &&
                   java.util.Objects.equals(dueDate, g.dueDate);
        }
        @Override public int hashCode() { return java.util.Objects.hash(facultyId, title, description, subject, dueDate); }
    }

    private TaskDTO convertToDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setSubject(task.getSubject());
        dto.setStatus(task.getStatus() != null ? task.getStatus().name() : "PENDING");
        
        if (task.getAssignedBy() != null) {
            dto.setAssignedById(task.getAssignedBy().getId());
            dto.setAssignedByFullName(task.getAssignedBy().getFullName());
        }
        
        if (task.getAssignedTo() != null) {
            dto.setAssignedToId(task.getAssignedTo().getId());
            dto.setAssignedToFullName(task.getAssignedTo().getFullName());
        }
        
        dto.setCreatedAt(task.getCreatedAt());
        dto.setDueDate(task.getDueDate());
        
        return dto;
    }
}