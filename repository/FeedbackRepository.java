package com.studenttrack.repository;

import com.studenttrack.entity.Feedback;
import com.studenttrack.entity.Task;
import com.studenttrack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByTask(Task task);
    List<Feedback> findByStudent(User student);
    List<Feedback> findByFaculty(User faculty);
    List<Feedback> findByTaskAndStudent(Task task, User student);
}