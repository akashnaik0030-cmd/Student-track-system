package com.studenttrack.repository;

import com.studenttrack.entity.LiveClass;
import com.studenttrack.entity.LiveClass.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LiveClassRepository extends JpaRepository<LiveClass, Long> {
    List<LiveClass> findByFacultyIdOrderByScheduledAtDesc(Long facultyId);
    
    List<LiveClass> findByClassEntityIdOrderByScheduledAtDesc(Long classId);
    
    List<LiveClass> findByStatusOrderByScheduledAtDesc(Status status);
    
    List<LiveClass> findByScheduledAtBetweenOrderByScheduledAtAsc(LocalDateTime start, LocalDateTime end);
    
    List<LiveClass> findByClassEntityIdAndStatusOrderByScheduledAtDesc(Long classId, Status status);
}
