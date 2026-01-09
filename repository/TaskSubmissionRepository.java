package com.studenttrack.repository;

import com.studenttrack.entity.TaskSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskSubmissionRepository extends JpaRepository<TaskSubmission, Long> {
    List<TaskSubmission> findByStudentId(Long studentId);
    List<TaskSubmission> findByTaskId(Long taskId);
}