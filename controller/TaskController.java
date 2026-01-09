package com.studenttrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.studenttrack.dto.TaskDTO;
import com.studenttrack.dto.TaskRequest;
import com.studenttrack.entity.Task;
import com.studenttrack.entity.TaskStatus;
import com.studenttrack.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping
//    @PreAuthorize("hasRole('HOD') or hasRole('FACULTY')")
    public ResponseEntity<?> createTask(@RequestBody String json) {
        try {
        	ObjectMapper mapper = new ObjectMapper();
        	mapper.registerModule(new JavaTimeModule());
        	TaskRequest taskRequest = mapper.readValue(json, TaskRequest.class);
            
            // Use the new method that supports multiple students
            java.util.List<Task> tasks = taskService.createTasksForMultipleStudents(taskRequest);
            
            String message = tasks.size() > 1 
                ? "Tasks created successfully for " + tasks.size() + " students!" 
                : "Task created successfully!";
            
            return ResponseEntity.ok(message);
        } catch (RuntimeException e ) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
        	return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<?> getMyTasks() {
        try {
            List<TaskDTO> taskList = taskService.getTasksByAssignedTo();
            return ResponseEntity.ok(taskList);
        } catch(Exception e) {
            e.printStackTrace();
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", "Error fetching tasks: " + (e.getMessage() != null ? e.getMessage() : "Unknown error"));
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/assigned-by-me")
//    @PreAuthorize("hasRole('HOD') or hasRole('FACULTY')")
    public ResponseEntity<?> getTasksAssignedByMe() {
        try {
            List<TaskDTO> taskList = taskService.getTasksByAssignedBy();
            return ResponseEntity.ok(taskList);
        } catch(Exception e) {
            e.printStackTrace();
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", "Error fetching tasks: " + (e.getMessage() != null ? e.getMessage() : "Unknown error"));
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TaskDTO>> getTasksByStatus(@PathVariable TaskStatus status) {
        List<TaskDTO> tasks = taskService.getTasksByStatus(status);
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/{taskId}/status")
    public ResponseEntity<?> updateTaskStatus(@PathVariable Long taskId, @RequestParam TaskStatus status) {
        try {
            TaskDTO dto = taskService.updateTaskStatus(taskId, status);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<?> getTaskById(@PathVariable Long taskId) {
        try {
            TaskDTO dto = taskService.getTaskById(taskId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching task: " + e.getMessage());
        }
    }

    @GetMapping
//    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> getAllTasks() {
        try {
            List<TaskDTO> taskList = taskService.getAllTasks();
            return ResponseEntity.ok(taskList);
        } catch (Exception e) {
            e.printStackTrace(); // Log the full stack trace for debugging
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", "Error fetching tasks: " + (e.getMessage() != null ? e.getMessage() : "Unknown error"));
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<?> getTasksByFacultyId(@PathVariable Long facultyId) {
        try {
            List<TaskDTO> taskList = taskService.getTasksByFacultyId(facultyId);
            return ResponseEntity.ok(taskList);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Aggregated views
    @GetMapping("/assigned-by-me/aggregated")
    public ResponseEntity<?> getAggregatedTasksAssignedByMe() {
        try {
            java.util.List<com.studenttrack.dto.AggregatedTaskDTO> list = taskService.getAggregatedTasksAssignedByMe();
            return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/aggregated")
    public ResponseEntity<?> getAggregatedTasks(@RequestParam(required = false) Long facultyId) {
        try {
            java.util.List<com.studenttrack.dto.AggregatedTaskDTO> list = taskService.getAggregatedTasksAll(facultyId);
            return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}