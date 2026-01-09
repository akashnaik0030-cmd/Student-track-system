package com.studenttrack.repository;

import com.studenttrack.entity.FacultyClassSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyClassSubjectRepository extends JpaRepository<FacultyClassSubject, Long> {
    
    List<FacultyClassSubject> findByFacultyIdAndIsActive(Long facultyId, Boolean isActive);
    
    List<FacultyClassSubject> findByClassEntityIdAndIsActive(Long classId, Boolean isActive);
    
    List<FacultyClassSubject> findByFacultyIdAndClassEntityIdAndIsActive(Long facultyId, Long classId, Boolean isActive);
    
    Optional<FacultyClassSubject> findByFacultyIdAndClassEntityIdAndSubjectAndIsActive(
        Long facultyId, Long classId, String subject, Boolean isActive);
    
    @Query("SELECT DISTINCT fcs.subject FROM FacultyClassSubject fcs WHERE fcs.classEntity.id = :classId AND fcs.isActive = true")
    List<String> findDistinctSubjectsByClassId(Long classId);
    
    @Query("SELECT fcs FROM FacultyClassSubject fcs WHERE fcs.faculty.id = :facultyId AND fcs.isActive = true")
    List<FacultyClassSubject> findActiveFacultyAssignments(Long facultyId);
}
