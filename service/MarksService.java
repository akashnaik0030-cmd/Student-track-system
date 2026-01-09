package com.studenttrack.service;

import com.studenttrack.dto.MarksDTO;
import com.studenttrack.dto.BulkMarksEntryDTO;
import com.studenttrack.dto.BulkMarksResponseDTO;
import com.studenttrack.entity.Marks;
import com.studenttrack.entity.User;
import com.studenttrack.repository.MarksRepository;
import com.studenttrack.repository.UserRepository;
import com.studenttrack.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class MarksService {
    
    private final MarksRepository marksRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final EmailService emailService;

    @Autowired
    public MarksService(MarksRepository marksRepository, 
                       UserRepository userRepository,
                       AuthService authService,
                       EmailService emailService) {
        this.marksRepository = marksRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.emailService = emailService;
    }

    private MarksDTO convertToDTO(Marks marks) {
        MarksDTO dto = new MarksDTO();
        dto.setId(marks.getId());
        dto.setStudentId(marks.getStudent().getId());
        dto.setStudentName(marks.getStudent().getFullName());
        dto.setStudentRollNumber(marks.getStudent().getRollNumber());
        dto.setFacultyId(marks.getFaculty().getId());
        dto.setFacultyName(marks.getFaculty().getFullName());
        dto.setSubject(marks.getSubject());
        dto.setAssessmentType(marks.getAssessmentType());
        dto.setMarks(marks.getMarks());
        dto.setMaxMarks(marks.getMaxMarks());
        dto.setRemarks(marks.getRemarks());
        dto.setDate(marks.getDate());
        return dto;
    }

    public List<MarksDTO> getAllMarks() {
        return marksRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public MarksDTO getMarksById(@NonNull Long id) {
        Objects.requireNonNull(id, "ID cannot be null");
        return marksRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Marks not found"));
    }

    public List<MarksDTO> getMarksByStudent(@NonNull Long studentId) {
        Objects.requireNonNull(studentId, "Student ID cannot be null");
        return marksRepository.findByStudentId(studentId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<MarksDTO> getMarksByFaculty(@NonNull Long facultyId) {
        Objects.requireNonNull(facultyId, "Faculty ID cannot be null");
        return marksRepository.findByFacultyId(facultyId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MarksDTO addMarks(MarksDTO dto) {
        UserPrincipal currentUser = authService.getCurrentUser();
        Long facultyId = Objects.requireNonNull(currentUser.getId(), "Faculty ID cannot be null");
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Marks marks = convertToEntity(dto);
        marks.setFaculty(faculty);
        Marks savedMarks = marksRepository.save(marks);
        
        // Send email notification to student
        User student = marks.getStudent();
        String subject = "New Marks Added";
        String message = String.format("Your marks for %s have been added. You scored %d out of %d.",
                marks.getSubject(), marks.getMarks(), marks.getMaxMarks());
        emailService.sendEmail(student.getEmail(), subject, message);
        
        return convertToDTO(savedMarks);
    }

    @Transactional
    public MarksDTO updateMarks(@NonNull Long id, @NonNull MarksDTO dto) {
        Objects.requireNonNull(id, "ID cannot be null");
        Objects.requireNonNull(dto, "Marks data cannot be null");
        
        Marks existingMarks = marksRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Marks not found"));
        
        // Check if the current user is authorized to update these marks
        UserPrincipal currentUser = authService.getCurrentUser();
        if (!existingMarks.getFaculty().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized to update these marks");
        }
        
        // Validate new marks values
        if (dto.getMarks() < 0 || dto.getMaxMarks() < 0) {
            throw new RuntimeException("Marks cannot be negative");
        }
        if (dto.getMarks() > dto.getMaxMarks()) {
            throw new RuntimeException("Marks cannot be greater than maximum marks");
        }
        
        // Update only allowed fields
        existingMarks.setMarks(dto.getMarks());
        existingMarks.setMaxMarks(dto.getMaxMarks());
        existingMarks.setRemarks(dto.getRemarks() != null ? dto.getRemarks().trim() : null);
        
        Marks updatedMarks = marksRepository.save(existingMarks);
        
        // Send email notification to student
        User student = updatedMarks.getStudent();
        String subject = "Marks Updated";
        String message = String.format("Your marks for %s have been updated. You scored %d out of %d.",
                updatedMarks.getSubject(), updatedMarks.getMarks(), updatedMarks.getMaxMarks());
        emailService.sendEmail(student.getEmail(), subject, message);
        
        return convertToDTO(updatedMarks);
    }

    @Transactional
    public void deleteMarks(@NonNull Long id) {
        Objects.requireNonNull(id, "ID cannot be null");
        Marks marks = marksRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Marks not found"));
        
        // Check if the current user is authorized to delete these marks
        UserPrincipal currentUser = authService.getCurrentUser();
        if (!marks.getFaculty().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized to delete these marks");
        }
        
        // Send notification to student about marks deletion
        User student = marks.getStudent();
        String subject = "Marks Deleted";
        String message = String.format("Your marks for %s have been deleted.",
                marks.getSubject());
        emailService.sendEmail(student.getEmail(), subject, message);
        
        marksRepository.deleteById(id);
    }

    private Marks convertToEntity(MarksDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Marks data cannot be null");
        }
        if (dto.getStudentId() == null) {
            throw new RuntimeException("Student ID is required");
        }
        if (dto.getSubject() == null || dto.getSubject().trim().isEmpty()) {
            throw new RuntimeException("Subject is required");
        }
        if (dto.getAssessmentType() == null) {
            throw new RuntimeException("Assessment type is required");
        }
        if (dto.getMarks() == null || dto.getMaxMarks() == null) {
            throw new RuntimeException("Marks and maximum marks are required");
        }
        if (dto.getMarks() < 0 || dto.getMaxMarks() < 0) {
            throw new RuntimeException("Marks cannot be negative");
        }
        if (dto.getMarks() > dto.getMaxMarks()) {
            throw new RuntimeException("Marks cannot be greater than maximum marks");
        }
        
        Marks marks = new Marks();
        if (dto.getId() != null) {
            marks.setId(dto.getId());
        }
        
        Long studentId = dto.getStudentId();
        Objects.requireNonNull(studentId, "Student ID cannot be null");
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        marks.setStudent(student);
        
        marks.setSubject(dto.getSubject().trim());
        marks.setAssessmentType(dto.getAssessmentType().trim());
        
        // Additional validation for marks
            int marksValue = dto.getMarks();
            int maxMarksValue = dto.getMaxMarks();
            if (maxMarksValue == 0) {
                throw new RuntimeException("Maximum marks cannot be zero");
            }
            double percentage = (marksValue * 100.0) / maxMarksValue;
            if (percentage > 100) {
                throw new RuntimeException("Marks percentage cannot exceed 100%");
            }
            
            marks.setMarks(marksValue);
            marks.setMaxMarks(maxMarksValue);
            
            // Trim remarks if present, otherwise set to null
            String remarks = dto.getRemarks();
            marks.setRemarks(remarks != null ? remarks.trim() : null);
            
        // Set current date for new marks entries
        marks.setDate(LocalDate.now());
        
        return marks;
    }

    public List<MarksDTO> getStudentMarks(@NonNull Long studentId) {
        Objects.requireNonNull(studentId, "Student ID cannot be null");
        Long id = studentId; // Ensure non-null
        User student = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return marksRepository.findByStudent(student).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<MarksDTO> getStudentMarksByType(@NonNull Long studentId, @NonNull String type) {
        Objects.requireNonNull(studentId, "Student ID cannot be null");
        Objects.requireNonNull(type, "Assessment type cannot be null");
        Long id = studentId; // Ensure non-null
        User student = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return marksRepository.findByStudentAndAssessmentType(student, type).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<MarksDTO> getStudentMarksBySubject(@NonNull Long studentId, @NonNull String subject) {
        Objects.requireNonNull(studentId, "Student ID cannot be null");
        Objects.requireNonNull(subject, "Subject cannot be null");
        Long id = studentId; // Ensure non-null
        User student = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return marksRepository.findByStudentAndSubject(student, subject).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<MarksDTO> getFacultyMarks(@NonNull Long facultyId) {
        Objects.requireNonNull(facultyId, "Faculty ID cannot be null");
        Long id = facultyId; // Ensure non-null
        User faculty = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
        return marksRepository.findByFaculty(faculty).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<MarksDTO> getMyMarks() {
        UserPrincipal currentUser = authService.getCurrentUser();
        Long studentId = Objects.requireNonNull(currentUser.getId(), "User ID cannot be null");
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return marksRepository.findByStudent(student).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public BulkMarksResponseDTO addBulkMarks(List<BulkMarksEntryDTO> entries) {
        BulkMarksResponseDTO response = new BulkMarksResponseDTO();
        UserPrincipal currentUser = authService.getCurrentUser();
        Long facultyId = Objects.requireNonNull(currentUser.getId(), "Faculty ID cannot be null");
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int savedCount = 0;
        int failedCount = 0;

        for (int i = 0; i < entries.size(); i++) {
            BulkMarksEntryDTO entry = entries.get(i);
            try {
                // Validate entry
                if (entry.getStudentId() == null) {
                    response.addError("Row " + (i+1) + ": Student ID is required");
                    failedCount++;
                    continue;
                }
                if (entry.getSubject() == null || entry.getSubject().trim().isEmpty()) {
                    response.addError("Row " + (i+1) + ": Subject is required");
                    failedCount++;
                    continue;
                }
                if (entry.getAssessmentType() == null || entry.getAssessmentType().trim().isEmpty()) {
                    response.addError("Row " + (i+1) + ": Assessment type is required");
                    failedCount++;
                    continue;
                }
                if (entry.getMarks() == null || entry.getMaxMarks() == null) {
                    response.addError("Row " + (i+1) + ": Marks and maximum marks are required");
                    failedCount++;
                    continue;
                }
                if (entry.getMarks() < 0 || entry.getMaxMarks() < 1) {
                    response.addError("Row " + (i+1) + ": Invalid marks values");
                    failedCount++;
                    continue;
                }
                if (entry.getMarks() > entry.getMaxMarks()) {
                    response.addError("Row " + (i+1) + ": Marks cannot exceed maximum marks");
                    failedCount++;
                    continue;
                }

                // Fetch student
                Long studentId = Objects.requireNonNull(entry.getStudentId(), "Student ID cannot be null");
                User student = userRepository.findById(studentId)
                        .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

                // Create Marks entity
                Marks marks = new Marks();
                marks.setStudent(student);
                marks.setFaculty(faculty);
                marks.setSubject(entry.getSubject().trim());
                marks.setAssessmentType(entry.getAssessmentType().trim());
                marks.setMarks(entry.getMarks());
                marks.setMaxMarks(entry.getMaxMarks());
                marks.setRemarks(entry.getRemarks() != null ? entry.getRemarks().trim() : null);
                marks.setDate(entry.getDate() != null ? entry.getDate() : LocalDate.now());

                marksRepository.save(marks);
                
                // Send email notification
                String subject = "New Marks Added";
                String message = String.format("Your marks for %s have been added. You scored %d out of %d.",
                        marks.getSubject(), marks.getMarks(), marks.getMaxMarks());
                emailService.sendEmail(student.getEmail(), subject, message);
                
                savedCount++;
            } catch (Exception e) {
                response.addError("Row " + (i+1) + ": " + e.getMessage());
                failedCount++;
            }
        }

        response.setSavedCount(savedCount);
        response.setFailedCount(failedCount);
        return response;
    }
}