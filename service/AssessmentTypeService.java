package com.studenttrack.service;

import com.studenttrack.dto.AssessmentTypeDTO;
import com.studenttrack.dto.AssessmentTypeRequest;
import com.studenttrack.entity.AssessmentType;
import com.studenttrack.entity.User;
import com.studenttrack.repository.AssessmentTypeRepository;
import com.studenttrack.repository.UserRepository;
import com.studenttrack.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssessmentTypeService {

    @Autowired
    private AssessmentTypeRepository assessmentTypeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    public AssessmentTypeDTO createAssessmentType(AssessmentTypeRequest request) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if name already exists
        if (assessmentTypeRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException("Assessment type with this name already exists");
        }

        AssessmentType assessmentType = new AssessmentType(
                request.getName(),
                request.getDescription(),
                faculty,
                request.getMaxMarks()
        );

        AssessmentType saved = assessmentTypeRepository.save(assessmentType);
        return convertToDTO(saved);
    }

    public List<AssessmentTypeDTO> getAllActive() {
        return assessmentTypeRepository.findByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AssessmentTypeDTO> getMyAssessmentTypes() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return assessmentTypeRepository.findByCreatedBy(faculty).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AssessmentTypeDTO updateAssessmentType(Long id, AssessmentTypeRequest request) {
        AssessmentType assessmentType = assessmentTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assessment type not found"));

        UserPrincipal currentUser = authService.getCurrentUser();
        
        // Only creator or HOD can update
        if (!assessmentType.getCreatedBy().getId().equals(currentUser.getId()) && 
            !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_HOD"))) {
            throw new RuntimeException("Not authorized to update this assessment type");
        }

        assessmentType.setName(request.getName());
        assessmentType.setDescription(request.getDescription());
        assessmentType.setMaxMarks(request.getMaxMarks());

        AssessmentType updated = assessmentTypeRepository.save(assessmentType);
        return convertToDTO(updated);
    }

    public void deleteAssessmentType(Long id) {
        AssessmentType assessmentType = assessmentTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assessment type not found"));

        UserPrincipal currentUser = authService.getCurrentUser();
        
        // Only creator or HOD can delete
        if (!assessmentType.getCreatedBy().getId().equals(currentUser.getId()) && 
            !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_HOD"))) {
            throw new RuntimeException("Not authorized to delete this assessment type");
        }

        // Soft delete
        assessmentType.setIsActive(false);
        assessmentTypeRepository.save(assessmentType);
    }

    public List<AssessmentTypeDTO> getAllByFaculty(Long facultyId) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        return assessmentTypeRepository.findByCreatedBy(faculty).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private AssessmentTypeDTO convertToDTO(AssessmentType assessmentType) {
        AssessmentTypeDTO dto = new AssessmentTypeDTO();
        dto.setId(assessmentType.getId());
        dto.setName(assessmentType.getName());
        dto.setDescription(assessmentType.getDescription());
        dto.setMaxMarks(assessmentType.getMaxMarks());
        dto.setCreatedAt(assessmentType.getCreatedAt());
        dto.setIsActive(assessmentType.getIsActive());
        
        if (assessmentType.getCreatedBy() != null) {
            dto.setCreatedById(assessmentType.getCreatedBy().getId());
            dto.setCreatedByName(assessmentType.getCreatedBy().getFullName());
        }
        
        return dto;
    }
}
