package com.studenttrack.repository;

import com.studenttrack.entity.QuizAnswer;
import com.studenttrack.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {
    List<QuizAnswer> findByAttempt(QuizAttempt attempt);
    List<QuizAnswer> findByAttemptId(Long attemptId);
}
