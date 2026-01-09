package com.studenttrack.service;

import com.studenttrack.entity.ClassEntity;
import com.studenttrack.repository.ClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ClassService {
    
    @Autowired
    private ClassRepository classRepository;
    
    // Create new class
    public ClassEntity createClass(ClassEntity classEntity) {
        if (classRepository.existsByName(classEntity.getName())) {
            throw new RuntimeException("Class with name '" + classEntity.getName() + "' already exists");
        }
        return classRepository.save(classEntity);
    }
    
    // Get all classes
    public List<ClassEntity> getAllClasses() {
        return classRepository.findAll();
    }
    
    // Get all active classes
    public List<ClassEntity> getActiveClasses() {
        return classRepository.findByIsActiveTrue();
    }
    
    // Get active classes ordered
    public List<ClassEntity> getActiveClassesOrdered() {
        return classRepository.findActiveClassesOrdered();
    }
    
    // Get class by ID
    public Optional<ClassEntity> getClassById(Long id) {
        return classRepository.findById(id);
    }
    
    // Get class by name
    public Optional<ClassEntity> getClassByName(String name) {
        return classRepository.findByName(name);
    }
    
    // Get classes by year
    public List<ClassEntity> getClassesByYear(String year) {
        return classRepository.findByYear(year);
    }
    
    // Get classes by department
    public List<ClassEntity> getClassesByDepartment(String department) {
        return classRepository.findByDepartment(department);
    }
    
    // Get classes by academic year
    public List<ClassEntity> getClassesByAcademicYear(String academicYear) {
        return classRepository.findByAcademicYear(academicYear);
    }
    
    // Update class
    public ClassEntity updateClass(Long id, ClassEntity updatedClass) {
        ClassEntity existingClass = classRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found with id: " + id));
        
        // Check if name is being changed and if new name already exists
        if (!existingClass.getName().equals(updatedClass.getName()) &&
                classRepository.existsByName(updatedClass.getName())) {
            throw new RuntimeException("Class with name '" + updatedClass.getName() + "' already exists");
        }
        
        existingClass.setName(updatedClass.getName());
        existingClass.setDivision(updatedClass.getDivision());
        existingClass.setYear(updatedClass.getYear());
        existingClass.setDepartment(updatedClass.getDepartment());
        existingClass.setAcademicYear(updatedClass.getAcademicYear());
        existingClass.setIsActive(updatedClass.getIsActive());
        
        return classRepository.save(existingClass);
    }
    
    // Deactivate class (soft delete)
    public void deactivateClass(Long id) {
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found with id: " + id));
        classEntity.setIsActive(false);
        classRepository.save(classEntity);
    }
    
    // Activate class
    public void activateClass(Long id) {
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found with id: " + id));
        classEntity.setIsActive(true);
        classRepository.save(classEntity);
    }
    
    // Delete class permanently
    public void deleteClass(Long id) {
        if (!classRepository.existsById(id)) {
            throw new RuntimeException("Class not found with id: " + id);
        }
        classRepository.deleteById(id);
    }
    
    // Check if class exists
    public boolean existsByName(String name) {
        return classRepository.existsByName(name);
    }
}
