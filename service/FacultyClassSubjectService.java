package com.studenttrack.service;

import com.studenttrack.dto.FacultyClassSubjectDTO;
import com.studenttrack.entity.ClassEntity;
import com.studenttrack.entity.FacultyClassSubject;
import com.studenttrack.entity.User;
import com.studenttrack.repository.ClassRepository;
import com.studenttrack.repository.FacultyClassSubjectRepository;
import com.studenttrack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacultyClassSubjectService {
    
    @Autowired
    private FacultyClassSubjectRepository facultyClassSubjectRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ClassRepository classRepository;
    
    @Transactional
    public FacultyClassSubject assignFacultyToClassSubject(Long facultyId, Long classId, String subject, Long assignedById) {
        User faculty = userRepository.findById(facultyId)
            .orElseThrow(() -> new RuntimeException("Faculty not found"));
        
        ClassEntity classEntity = classRepository.findById(classId)
            .orElseThrow(() -> new RuntimeException("Class not found"));
        
        // Check if assignment already exists
        var existing = facultyClassSubjectRepository.findByFacultyIdAndClassEntityIdAndSubjectAndIsActive(
            facultyId, classId, subject, true);
        
        if (existing.isPresent()) {
            throw new RuntimeException("Faculty is already assigned to this class for this subject");
        }
        
        FacultyClassSubject assignment = new FacultyClassSubject();
        assignment.setFaculty(faculty);
        assignment.setClassEntity(classEntity);
        assignment.setSubject(subject);
        assignment.setAssignedById(assignedById);
        assignment.setIsActive(true);
        
        return facultyClassSubjectRepository.save(assignment);
    }
    
    public List<FacultyClassSubjectDTO> getFacultyAssignments(Long facultyId) {
        List<FacultyClassSubject> assignments = facultyClassSubjectRepository.findByFacultyIdAndIsActive(facultyId, true);
        return assignments.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    public List<FacultyClassSubjectDTO> getClassAssignments(Long classId) {
        List<FacultyClassSubject> assignments = facultyClassSubjectRepository.findByClassEntityIdAndIsActive(classId, true);
        return assignments.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    public List<FacultyClassSubjectDTO> getAllAssignments() {
        List<FacultyClassSubject> assignments = facultyClassSubjectRepository.findAll();
        return assignments.stream()
            .filter(a -> a.getIsActive())
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public List<String> getSubjectsForClass(Long classId) {
        return facultyClassSubjectRepository.findDistinctSubjectsByClassId(classId);
    }
    
    @Transactional
    public void removeAssignment(Long assignmentId) {
        FacultyClassSubject assignment = facultyClassSubjectRepository.findById(assignmentId)
            .orElseThrow(() -> new RuntimeException("Assignment not found"));
        assignment.setIsActive(false);
        facultyClassSubjectRepository.save(assignment);
    }
    
    private FacultyClassSubjectDTO convertToDTO(FacultyClassSubject assignment) {
        FacultyClassSubjectDTO dto = new FacultyClassSubjectDTO();
        dto.setId(assignment.getId());
        dto.setFacultyId(assignment.getFaculty().getId());
        dto.setFacultyName(assignment.getFaculty().getFullName());
        dto.setClassId(assignment.getClassEntity().getId());
        dto.setClassName(assignment.getClassEntity().getFullName());
        dto.setSubject(assignment.getSubject());
        dto.setIsActive(assignment.getIsActive());
        return dto;
    }
}
