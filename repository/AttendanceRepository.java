package com.studenttrack.repository;

import com.studenttrack.entity.Attendance;
import com.studenttrack.entity.AttendanceStatus;
import com.studenttrack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByDateAndStudent(LocalDate date, User student);
    
    Optional<Attendance> findByDateAndStudentAndFaculty(LocalDate date, User student, User faculty);
    
    List<Attendance> findByStudent(User student);
    
    List<Attendance> findByFaculty(User faculty);
    
    List<Attendance> findByStudentAndDateBetween(User student, LocalDate startDate, LocalDate endDate);
    
    List<Attendance> findByStudentIdAndDateBetween(Long studentId, LocalDate startDate, LocalDate endDate);
    
    List<Attendance> findByFacultyAndDateBetween(User faculty, LocalDate startDate, LocalDate endDate);
    
    List<Attendance> findByFacultyIdAndDateBetween(Long facultyId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT DISTINCT a FROM Attendance a JOIN FETCH a.student JOIN FETCH a.faculty WHERE a.faculty = :faculty AND a.date BETWEEN :startDate AND :endDate")
    List<Attendance> findByFacultyAndDateBetweenWithUsers(@Param("faculty") User faculty, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT a FROM Attendance a WHERE a.date BETWEEN :startDate AND :endDate")
    List<Attendance> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT DISTINCT a FROM Attendance a JOIN FETCH a.student JOIN FETCH a.faculty WHERE a.date BETWEEN :startDate AND :endDate")
    List<Attendance> findByDateRangeWithUsers(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    List<Attendance> findByDate(LocalDate date);
    
    @Query("SELECT DISTINCT a FROM Attendance a JOIN FETCH a.student JOIN FETCH a.faculty WHERE a.date = :date")
    List<Attendance> findByDateWithUsers(@Param("date") LocalDate date);
    
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student = :student AND a.status = :status AND a.date BETWEEN :startDate AND :endDate")
    Long countByStudentAndStatusAndDateRange(@Param("student") User student, 
                                              @Param("status") AttendanceStatus status,
                                              @Param("startDate") LocalDate startDate, 
                                              @Param("endDate") LocalDate endDate);
}


