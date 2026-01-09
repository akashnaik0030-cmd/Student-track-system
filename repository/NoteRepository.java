package com.studenttrack.repository;

import com.studenttrack.entity.Note;
import com.studenttrack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByCreatedBy(User createdBy);
    
    List<Note> findByAssignedTo(User assignedTo);
    
    List<Note> findByIsPublicTrue();
    
    List<Note> findByCreatedByAndIsPublicTrue(User createdBy);
    
    List<Note> findByCreatedByOrIsPublicTrue(User createdBy);
}


