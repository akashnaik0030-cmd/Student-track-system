package com.studenttrack.controller;

import com.studenttrack.dto.AssessmentTypeDTO;
import com.studenttrack.dto.AssessmentTypeRequest;
import com.studenttrack.dto.MessageResponse;
import com.studenttrack.service.AssessmentTypeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assessment-types")
public class AssessmentTypeController {

    @Autowired
    private AssessmentTypeService assessmentTypeService;

    @PostMapping
    @PreAuthorize("hasRole('FACULTY') or hasRole('HOD')")
    public ResponseEntity<?> createAssessmentType(@Valid @RequestBody AssessmentTypeRequest request) {
        try {
            AssessmentTypeDTO created = assessmentTypeService.createAssessmentType(request);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<AssessmentTypeDTO>> getAllActive() {
        return ResponseEntity.ok(assessmentTypeService.getAllActive());
    }

    @GetMapping("/my-types")
    @PreAuthorize("hasRole('FACULTY') or hasRole('HOD')")
    public ResponseEntity<List<AssessmentTypeDTO>> getMyAssessmentTypes() {
        return ResponseEntity.ok(assessmentTypeService.getMyAssessmentTypes());
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<List<AssessmentTypeDTO>> getByFaculty(@PathVariable Long facultyId) {
        return ResponseEntity.ok(assessmentTypeService.getAllByFaculty(facultyId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FACULTY') or hasRole('HOD')")
    public ResponseEntity<?> updateAssessmentType(@PathVariable Long id, @Valid @RequestBody AssessmentTypeRequest request) {
        try {
            AssessmentTypeDTO updated = assessmentTypeService.updateAssessmentType(id, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FACULTY') or hasRole('HOD')")
    public ResponseEntity<?> deleteAssessmentType(@PathVariable Long id) {
        try {
            assessmentTypeService.deleteAssessmentType(id);
            return ResponseEntity.ok(new MessageResponse("Assessment type deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
