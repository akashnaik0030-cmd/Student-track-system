package com.studenttrack.service;

import com.studenttrack.dto.NoteDTO;
import com.studenttrack.dto.NoteRequest;
import com.studenttrack.entity.Note;
import com.studenttrack.entity.User;
import com.studenttrack.repository.NoteRepository;
import com.studenttrack.repository.UserRepository;
import com.studenttrack.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private EmailService emailService;

    public List<Note> createNotes(NoteRequest noteRequest, MultipartFile file) throws Exception {
        UserPrincipal currentUser = authService.getCurrentUser();
        User createdBy = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Handle file upload
        String fileName = null;
        Long fileSize = null;
        if (file != null && !file.isEmpty()) {
            String storedFileName = fileStorageService.storeFile(file);
            fileName = file.getOriginalFilename();
            fileSize = file.getSize();
            
            // Store file info in first note
            noteRequest.setFileName(storedFileName);
            noteRequest.setFileSize(fileSize);
        }
        
        List<Note> createdNotes = new ArrayList<>();
        
        // If assignedToIds is provided, create notes for multiple students
        if (noteRequest.getAssignedToIds() != null && !noteRequest.getAssignedToIds().isEmpty()) {
            for (Long studentId : noteRequest.getAssignedToIds()) {
                User assignedTo = userRepository.findById(studentId)
                        .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
                
                Note note = new Note(
                        noteRequest.getTitle(),
                        noteRequest.getContent(),
                        createdBy,
                        assignedTo,
                        false
                );
                
                // Set file information
                if (fileName != null) {
                    note.setFileName(fileName);
                    note.setFilePath(noteRequest.getFileName());
                    note.setFileSize(fileSize);
                }
                
                createdNotes.add(noteRepository.save(note));
            }
        } else if (noteRequest.getIsPublic() != null && noteRequest.getIsPublic()) {
            // If it's a public note (for all students), don't assign to specific student
            Note note = new Note(
                    noteRequest.getTitle(),
                    noteRequest.getContent(),
                    createdBy,
                    null,
                    true
            );
            
            // Set file information
            if (fileName != null) {
                note.setFileName(fileName);
                note.setFilePath(noteRequest.getFileName());
                note.setFileSize(fileSize);
            }
            
            createdNotes.add(noteRepository.save(note));
        } else {
            // Fallback to single assignment
            User assignedTo = noteRequest.getAssignedToId() != null 
                    ? userRepository.findById(noteRequest.getAssignedToId())
                          .orElseThrow(() -> new RuntimeException("Assigned user not found"))
                    : null;
            
            Note note = new Note(
                    noteRequest.getTitle(),
                    noteRequest.getContent(),
                    createdBy,
                    assignedTo,
                    noteRequest.getIsPublic()
            );
            
            // Set file information
            if (fileName != null) {
                note.setFileName(fileName);
                note.setFilePath(noteRequest.getFileName());
                note.setFileSize(fileSize);
            }
            
            Note savedNote = noteRepository.save(note);
            createdNotes.add(savedNote);
        }
        
        // Send email notifications
        List<String> studentEmails = new ArrayList<>();
        
        if (noteRequest.getAssignedToIds() != null && !noteRequest.getAssignedToIds().isEmpty()) {
            // Collect emails for specific students
            for (Long studentId : noteRequest.getAssignedToIds()) {
                userRepository.findById(studentId).ifPresent(student -> {
                    if (student.getEmail() != null && !student.getEmail().isEmpty()) {
                        studentEmails.add(student.getEmail());
                    }
                });
            }
        } else if (Boolean.TRUE.equals(noteRequest.getIsPublic())) {
            // Send to all students for public notes
            List<User> allStudents = userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().stream()
                    .anyMatch(r -> r.getName() != null && "ROLE_STUDENT".equals(r.getName().name())))
                .collect(java.util.stream.Collectors.toList());
            
            List<String> publicEmails = allStudents.stream()
                .filter(s -> s.getEmail() != null && !s.getEmail().isEmpty())
                .map(User::getEmail)
                .collect(java.util.stream.Collectors.toList());

            studentEmails.addAll(publicEmails);
        }
        
        if (!studentEmails.isEmpty()) {
            boolean hasAttachment = fileName != null && !fileName.isEmpty();
            String subject = noteRequest.getTitle();
            emailService.sendNoteNotification(studentEmails, noteRequest.getTitle(), 
                subject, createdBy.getUsername(), hasAttachment);
        }
        
        return createdNotes;
    }

    public List<NoteDTO> getMyNotes() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get notes assigned to this user or public notes
        List<Note> notes = noteRepository.findByAssignedTo(user);
        List<Note> publicNotes = noteRepository.findByIsPublicTrue();
        
        List<NoteDTO> noteDTOs = new ArrayList<>();
        
        for (Note note : notes) {
            noteDTOs.add(convertToDTO(note));
        }
        
        for (Note note : publicNotes) {
            noteDTOs.add(convertToDTO(note));
        }
        
        return noteDTOs;
    }

    public List<NoteDTO> getNotesCreatedByMe() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Note> notes = noteRepository.findByCreatedBy(user);
        
        // Group notes by title, content, and creation time to remove duplicates
        // When a note is sent to multiple students, show it only once
        List<NoteDTO> uniqueNotes = new ArrayList<>();
        java.util.Set<String> seenNotes = new java.util.HashSet<>();
        
        for (Note note : notes) {
            String uniqueKey = note.getTitle() + "|" + note.getContent() + "|" + 
                              (note.getCreatedAt() != null ? note.getCreatedAt().toString() : "");
            
            if (!seenNotes.contains(uniqueKey)) {
                seenNotes.add(uniqueKey);
                NoteDTO dto = convertToDTO(note);
                
                // For notes sent to multiple students, indicate it's for multiple recipients
                if (!note.getIsPublic()) {
                    long recipientCount = notes.stream()
                        .filter(n -> n.getTitle().equals(note.getTitle()) && 
                                   n.getContent().equals(note.getContent()) &&
                                   n.getCreatedAt() != null && note.getCreatedAt() != null &&
                                   n.getCreatedAt().equals(note.getCreatedAt()))
                        .count();
                    
                    if (recipientCount > 1) {
                        // Add recipient count to the DTO or modify display
                        dto.setContent(dto.getContent() + " [Sent to " + recipientCount + " students]");
                    }
                }
                
                uniqueNotes.add(dto);
            }
        }
        
        return uniqueNotes;
    }

    public List<NoteDTO> getAllNotes() {
        List<Note> notes = noteRepository.findAll();
        return notes.stream()
                .map(this::convertToDTO)
                .toList();
    }

    public void deleteNote(Long noteId) {
        UserPrincipal currentUser = authService.getCurrentUser();
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        
        // Only allow the creator to delete
        if (!note.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You don't have permission to delete this note");
        }
        
        noteRepository.delete(note);
    }

    private NoteDTO convertToDTO(Note note) {
        NoteDTO dto = new NoteDTO();
        dto.setId(note.getId());
        dto.setTitle(note.getTitle());
        dto.setContent(note.getContent());
        dto.setCreatedById(note.getCreatedBy().getId());
        dto.setCreatedByName(note.getCreatedBy().getFullName());
        
        if (note.getIsPublic() != null && note.getIsPublic()) {
            // For public notes, show "All Students" instead of individual names
            dto.setAssignedToId(null);
            dto.setAssignedToName("All Students");
        } else if (note.getAssignedTo() != null) {
            dto.setAssignedToId(note.getAssignedTo().getId());
            dto.setAssignedToName(note.getAssignedTo().getFullName());
        }
        
        dto.setIsPublic(note.getIsPublic());
        dto.setCreatedAt(note.getCreatedAt());
        dto.setUpdatedAt(note.getUpdatedAt());
        dto.setFileName(note.getFileName());
        dto.setFilePath(note.getFilePath());
        dto.setFileSize(note.getFileSize());
        
        return dto;
    }
}

