package com.studenttrack.controller;

import com.studenttrack.dto.LiveClassDTO;
import com.studenttrack.entity.LiveClass;
import com.studenttrack.security.UserPrincipal;
import com.studenttrack.service.AuthService;
import com.studenttrack.service.LiveClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/live-classes")
@CrossOrigin(origins = "*")
public class LiveClassController {

    @Autowired
    private LiveClassService liveClassService;

    @Autowired
    private AuthService authService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_FACULTY', 'ROLE_HOD')")
    public ResponseEntity<?> createLiveClass(@RequestBody LiveClassDTO liveClassDTO) {
        try {
            UserPrincipal currentUser = authService.getCurrentUser();
            LiveClass created = liveClassService.createLiveClass(liveClassDTO, currentUser.getId());
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping
    public ResponseEntity<List<LiveClass>> getAllLiveClasses() {
        return ResponseEntity.ok(liveClassService.getAllLiveClasses());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<LiveClass>> getUpcomingLiveClasses() {
        return ResponseEntity.ok(liveClassService.getUpcomingLiveClasses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLiveClassById(@PathVariable Long id) {
        return liveClassService.getLiveClassById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<List<LiveClass>> getLiveClassesByFaculty(@PathVariable Long facultyId) {
        return ResponseEntity.ok(liveClassService.getLiveClassesByFaculty(facultyId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<LiveClass>> getLiveClassesByClass(@PathVariable Long classId) {
        return ResponseEntity.ok(liveClassService.getLiveClassesByClass(classId));
    }

    @GetMapping("/class/{classId}/upcoming")
    public ResponseEntity<List<LiveClass>> getUpcomingLiveClassesForClass(@PathVariable Long classId) {
        return ResponseEntity.ok(liveClassService.getUpcomingLiveClassesForClass(classId));
    }

    @GetMapping("/my-classes")
    @PreAuthorize("hasAnyRole('ROLE_FACULTY', 'ROLE_HOD')")
    public ResponseEntity<List<LiveClass>> getMyLiveClasses() {
        UserPrincipal currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(liveClassService.getLiveClassesByFaculty(currentUser.getId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FACULTY', 'ROLE_HOD')")
    public ResponseEntity<?> updateLiveClass(@PathVariable Long id, @RequestBody LiveClassDTO liveClassDTO) {
        try {
            LiveClass updated = liveClassService.updateLiveClass(id, liveClassDTO);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ROLE_FACULTY', 'ROLE_HOD')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam LiveClass.Status status) {
        try {
            LiveClass updated = liveClassService.updateStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/{id}/recording")
    @PreAuthorize("hasAnyRole('ROLE_FACULTY', 'ROLE_HOD')")
    public ResponseEntity<?> addRecording(@PathVariable Long id, @RequestParam String recordingUrl) {
        try {
            LiveClass updated = liveClassService.addRecording(id, recordingUrl);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FACULTY', 'ROLE_HOD')")
    public ResponseEntity<Map<String, String>> deleteLiveClass(@PathVariable Long id) {
        liveClassService.deleteLiveClass(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Live class deleted successfully");
        return ResponseEntity.ok(response);
    }
}
