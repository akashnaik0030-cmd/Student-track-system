package com.studenttrack.repository;

import com.studenttrack.entity.Submission;
import com.studenttrack.entity.Task;
import com.studenttrack.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    @EntityGraph(attributePaths = {"task", "task.assignedBy", "student"})
    List<Submission> findByTask(Task task);

    @EntityGraph(attributePaths = {"task", "task.assignedBy", "student"})
    List<Submission> findByStudent(User student);

    @EntityGraph(attributePaths = {"task", "task.assignedBy", "student"})
    List<Submission> findByTaskAndStudent(Task task, User student);
    
    @EntityGraph(attributePaths = {"task", "task.assignedBy", "student"})
    @Query("SELECT s FROM Submission s WHERE s.task.assignedBy = :faculty")
    List<Submission> findByTaskAssignedBy(@Param("faculty") User faculty);

    // Override findAll to eagerly fetch required associations used by DTO mapping
    @Override
    @EntityGraph(attributePaths = {"task", "task.assignedBy", "student"})
    List<Submission> findAll();
}