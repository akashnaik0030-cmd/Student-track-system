package com.studenttrack.controller;

import com.studenttrack.service.MarksService;
import com.studenttrack.dto.MarksDTO;
import com.studenttrack.dto.BulkMarksEntryDTO;
import com.studenttrack.dto.BulkMarksRequestDTO;
import com.studenttrack.dto.BulkMarksResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/marks")
public class MarksController {

    @Autowired
    private MarksService marksService;

    @PostMapping
    public ResponseEntity<?> addMarks(@Valid @RequestBody MarksDTO marksDTO) {
        try {
            MarksDTO savedMarks = marksService.addMarks(marksDTO);
            return ResponseEntity.ok(savedMarks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error adding marks: " + e.getMessage());
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentMarks(@PathVariable Long studentId) {
        try {
            List<MarksDTO> marks = marksService.getStudentMarks(studentId);
            return ResponseEntity.ok(marks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching marks: " + e.getMessage());
        }
    }

    @GetMapping("/student/{studentId}/type/{type}")
    public ResponseEntity<?> getStudentMarksByType(
            @PathVariable Long studentId,
            @PathVariable String type) {
        try {
            List<MarksDTO> marks = marksService.getStudentMarksByType(studentId, type);
            return ResponseEntity.ok(marks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching marks: " + e.getMessage());
        }
    }

    @GetMapping("/student/{studentId}/subject/{subject}")
    public ResponseEntity<?> getStudentMarksBySubject(
            @PathVariable Long studentId,
            @PathVariable String subject) {
        try {
            List<MarksDTO> marks = marksService.getStudentMarksBySubject(studentId, subject);
            return ResponseEntity.ok(marks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching marks: " + e.getMessage());
        }
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<?> getFacultyMarks(@PathVariable Long facultyId) {
        try {
            List<MarksDTO> marks = marksService.getFacultyMarks(facultyId);
            return ResponseEntity.ok(marks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching marks: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllMarks() {
        try {
            List<MarksDTO> marks = marksService.getAllMarks();
            return ResponseEntity.ok(marks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching all marks: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyMarks() {
        try {
            List<MarksDTO> marks = marksService.getMyMarks();
            return ResponseEntity.ok(marks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching your marks: " + e.getMessage());
        }
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> addBulkMarks(@Valid @RequestBody BulkMarksRequestDTO request) {
        try {
            BulkMarksResponseDTO response = marksService.addBulkMarks(request.getEntries());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error adding bulk marks: " + e.getMessage());
        }
    }
}