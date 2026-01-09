package com.studenttrack.repository;

import com.studenttrack.entity.Marks;
import com.studenttrack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarksRepository extends JpaRepository<Marks, Long> {
    List<Marks> findByStudent(User student);
    List<Marks> findByStudentId(Long studentId);
    List<Marks> findByFaculty(User faculty);
    List<Marks> findByFacultyId(Long facultyId);
    List<Marks> findByStudentAndAssessmentType(User student, String assessmentType);
    List<Marks> findByStudentAndSubject(User student, String subject);
    List<Marks> findByStudentIdAndDateBetween(Long studentId, java.time.LocalDate startDate, java.time.LocalDate endDate);
}