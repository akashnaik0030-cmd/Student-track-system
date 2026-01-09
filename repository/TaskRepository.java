package com.studenttrack.repository;

import com.studenttrack.entity.Task;
import com.studenttrack.entity.User;
import com.studenttrack.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByAssignedTo(User assignedTo);
    List<Task> findByAssignedBy(User assignedBy);
    List<Task> findByAssignedToAndStatus(User assignedTo, TaskStatus status);
    List<Task> findByAssignedByAndStatus(User assignedBy, TaskStatus status);
    
    @Query("SELECT DISTINCT t FROM Task t JOIN FETCH t.assignedBy JOIN FETCH t.assignedTo")
    List<Task> findAllWithUsers();
    
    List<Task> findByAssignedToId(Long studentId);
    @Query("SELECT DISTINCT t FROM Task t JOIN FETCH t.assignedBy JOIN FETCH t.assignedTo WHERE t.assignedBy = :assignedBy")
    List<Task> findByAssignedByWithUsers(@org.springframework.data.repository.query.Param("assignedBy") User assignedBy);
    
    @Query("SELECT DISTINCT t FROM Task t JOIN FETCH t.assignedBy JOIN FETCH t.assignedTo WHERE t.assignedTo = :assignedTo")
    List<Task> findByAssignedToWithUsers(@org.springframework.data.repository.query.Param("assignedTo") User assignedTo);
    
    @Query("SELECT t FROM Task t JOIN FETCH t.assignedBy JOIN FETCH t.assignedTo WHERE t.id = :id")
    java.util.Optional<Task> findByIdWithUsers(@org.springframework.data.repository.query.Param("id") Long id);
}