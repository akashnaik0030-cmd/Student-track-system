package com.studenttrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.studenttrack.dto.NoteDTO;
import com.studenttrack.dto.NoteRequest;
import com.studenttrack.entity.Note;
import com.studenttrack.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired
    private NoteService noteService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createNote(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "assignedToIds", required = false) List<Long> assignedToIds,
            @RequestParam(value = "isPublic", defaultValue = "false") Boolean isPublic,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            NoteRequest noteRequest = new NoteRequest();
            noteRequest.setTitle(title);
            noteRequest.setContent(content);
            noteRequest.setAssignedToIds(assignedToIds);
            noteRequest.setIsPublic(isPublic);
            
            List<Note> notes = noteService.createNotes(noteRequest, file);
            
            String message = notes.size() > 1 
                ? "Notes created successfully for " + notes.size() + " students!" 
                : "Note created successfully!";
            
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating note: " + e.getMessage());
        }
    }

    @GetMapping("/my-notes")
    public ResponseEntity<?> getMyNotes() {
        try {
            List<NoteDTO> notes = noteService.getMyNotes();
            
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String json = mapper.writeValueAsString(notes);
            return ResponseEntity.ok(json);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching notes: " + e.getMessage());
        }
    }

    @GetMapping("/created-by-me")
    public ResponseEntity<?> getNotesCreatedByMe() {
        try {
            List<NoteDTO> notes = noteService.getNotesCreatedByMe();
            
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String json = mapper.writeValueAsString(notes);
            return ResponseEntity.ok(json);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching notes: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllNotes() {
        try {
            List<NoteDTO> notes = noteService.getAllNotes();
            
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String json = mapper.writeValueAsString(notes);
            return ResponseEntity.ok(json);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching notes: " + e.getMessage());
        }
    }

    @GetMapping("/{noteId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long noteId) {
        try {
            // Try to find note in user's received notes (for students)
            NoteDTO note = noteService.getMyNotes().stream()
                    .filter(n -> n.getId().equals(noteId))
                    .findFirst()
                    .orElse(null);
            
            // If not found, try faculty's created notes (for faculty/HOD)
            if (note == null) {
                note = noteService.getNotesCreatedByMe().stream()
                        .filter(n -> n.getId().equals(noteId))
                        .findFirst()
                        .orElse(null);
            }
            
            if (note == null || note.getFilePath() == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Handle file path - it might already include "uploads/" or not
            String filePath = note.getFilePath();
            if (!filePath.startsWith("uploads/") && !filePath.startsWith("uploads\\")) {
                filePath = "uploads/" + filePath;
            }
            
            File file = new File(filePath);
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(file);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + note.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<?> deleteNote(@PathVariable Long noteId) {
        try {
            noteService.deleteNote(noteId);
            return ResponseEntity.ok("Note deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting note: " + e.getMessage());
        }
    }
}
