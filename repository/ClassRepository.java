package com.studenttrack.repository;

import com.studenttrack.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, Long> {
    
    // Find class by name
    Optional<ClassEntity> findByName(String name);
    
    // Find all active classes
    List<ClassEntity> findByIsActiveTrue();
    
    // Find classes by year
    List<ClassEntity> findByYear(String year);
    
    // Find classes by department
    List<ClassEntity> findByDepartment(String department);
    
    // Find classes by academic year
    List<ClassEntity> findByAcademicYear(String academicYear);
    
    // Find classes by year and department
    List<ClassEntity> findByYearAndDepartment(String year, String department);
    
    // Check if class name exists
    boolean existsByName(String name);
    
    // Get active classes with student count
    @Query("SELECT c FROM ClassEntity c WHERE c.isActive = true ORDER BY c.year, c.division")
    List<ClassEntity> findActiveClassesOrdered();
}
