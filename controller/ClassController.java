package com.studenttrack.controller;

import com.studenttrack.entity.ClassEntity;
import com.studenttrack.service.ClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ClassController {
    
    @Autowired
    private ClassService classService;
    
    // Get all classes (HOD and Faculty)
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_HOD', 'ROLE_FACULTY')")
    public ResponseEntity<List<ClassEntity>> getAllClasses() {
        try {
            List<ClassEntity> classes = classService.getAllClasses();
            return ResponseEntity.ok(classes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get active classes only
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ROLE_HOD', 'ROLE_FACULTY')")
    public ResponseEntity<List<ClassEntity>> getActiveClasses() {
        try {
            List<ClassEntity> classes = classService.getActiveClassesOrdered();
            return ResponseEntity.ok(classes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get class by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_HOD', 'ROLE_FACULTY')")
    public ResponseEntity<?> getClassById(@PathVariable Long id) {
        try {
            return classService.getClassById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    // Get classes by year
    @GetMapping("/year/{year}")
    @PreAuthorize("hasAnyRole('ROLE_HOD', 'ROLE_FACULTY')")
    public ResponseEntity<List<ClassEntity>> getClassesByYear(@PathVariable String year) {
        try {
            List<ClassEntity> classes = classService.getClassesByYear(year);
            return ResponseEntity.ok(classes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get classes by department
    @GetMapping("/department/{department}")
    @PreAuthorize("hasAnyRole('ROLE_HOD', 'ROLE_FACULTY')")
    public ResponseEntity<List<ClassEntity>> getClassesByDepartment(@PathVariable String department) {
        try {
            List<ClassEntity> classes = classService.getClassesByDepartment(department);
            return ResponseEntity.ok(classes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Create new class (HOD only)
    @PostMapping
    @PreAuthorize("hasRole('ROLE_HOD')")
    public ResponseEntity<?> createClass(@RequestBody ClassEntity classEntity) {
        try {
            ClassEntity createdClass = classService.createClass(classEntity);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdClass);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create class: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // Update class (HOD only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_HOD')")
    public ResponseEntity<?> updateClass(@PathVariable Long id, @RequestBody ClassEntity classEntity) {
        try {
            ClassEntity updatedClass = classService.updateClass(id, classEntity);
            return ResponseEntity.ok(updatedClass);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update class: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // Deactivate class (HOD only)
    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ROLE_HOD')")
    public ResponseEntity<?> deactivateClass(@PathVariable Long id) {
        try {
            classService.deactivateClass(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Class deactivated successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to deactivate class: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // Activate class (HOD only)
    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ROLE_HOD')")
    public ResponseEntity<?> activateClass(@PathVariable Long id) {
        try {
            classService.activateClass(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Class activated successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to activate class: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // Delete class permanently (HOD only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_HOD')")
    public ResponseEntity<?> deleteClass(@PathVariable Long id) {
        try {
            classService.deleteClass(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Class deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete class: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // Check if class name exists
    @GetMapping("/exists/{name}")
    @PreAuthorize("hasRole('ROLE_HOD')")
    public ResponseEntity<Map<String, Boolean>> checkClassExists(@PathVariable String name) {
        boolean exists = classService.existsByName(name);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }
}
