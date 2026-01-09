package com.studenttrack.controller;

import com.studenttrack.dto.FacultyClassSubjectDTO;
import com.studenttrack.entity.FacultyClassSubject;
import com.studenttrack.security.UserPrincipal;
import com.studenttrack.service.AuthService;
import com.studenttrack.service.FacultyClassSubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/faculty-class-subjects")
@CrossOrigin(origins = "*")
public class FacultyClassSubjectController {
    
    @Autowired
    private FacultyClassSubjectService facultyClassSubjectService;
    
    @Autowired
    private AuthService authService;
    
    @PostMapping
    @PreAuthorize("hasRole('ROLE_HOD')")
    public ResponseEntity<?> assignFacultyToClass(@RequestBody Map<String, Object> request) {
        try {
            Long facultyId = Long.valueOf(request.get("facultyId").toString());
            Long classId = Long.valueOf(request.get("classId").toString());
            String subject = request.get("subject").toString();
            
            UserPrincipal currentUser = authService.getCurrentUser();
            FacultyClassSubject assignment = facultyClassSubjectService.assignFacultyToClassSubject(
                facultyId, classId, subject, currentUser.getId());
            
            return ResponseEntity.ok(assignment);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_HOD', 'ROLE_FACULTY')")
    public ResponseEntity<List<FacultyClassSubjectDTO>> getAllAssignments() {
        return ResponseEntity.ok(facultyClassSubjectService.getAllAssignments());
    }
    
    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasAnyRole('ROLE_HOD', 'ROLE_FACULTY')")
    public ResponseEntity<List<FacultyClassSubjectDTO>> getFacultyAssignments(@PathVariable Long facultyId) {
        return ResponseEntity.ok(facultyClassSubjectService.getFacultyAssignments(facultyId));
    }
    
    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ROLE_HOD', 'ROLE_FACULTY')")
    public ResponseEntity<List<FacultyClassSubjectDTO>> getClassAssignments(@PathVariable Long classId) {
        return ResponseEntity.ok(facultyClassSubjectService.getClassAssignments(classId));
    }
    
    @GetMapping("/class/{classId}/subjects")
    @PreAuthorize("hasAnyRole('ROLE_HOD', 'ROLE_FACULTY', 'ROLE_STUDENT')")
    public ResponseEntity<List<String>> getSubjectsForClass(@PathVariable Long classId) {
        return ResponseEntity.ok(facultyClassSubjectService.getSubjectsForClass(classId));
    }
    
    @DeleteMapping("/{assignmentId}")
    @PreAuthorize("hasRole('ROLE_HOD')")
    public ResponseEntity<Map<String, String>> removeAssignment(@PathVariable Long assignmentId) {
        facultyClassSubjectService.removeAssignment(assignmentId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Assignment removed successfully");
        return ResponseEntity.ok(response);
    }
}
