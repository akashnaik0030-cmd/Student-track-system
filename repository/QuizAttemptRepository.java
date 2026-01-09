package com.studenttrack.repository;

import com.studenttrack.entity.Quiz;
import com.studenttrack.entity.QuizAttempt;
import com.studenttrack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    
    Optional<QuizAttempt> findByQuizAndStudent(Quiz quiz, User student);
    
    List<QuizAttempt> findByQuiz(Quiz quiz);
    
    List<QuizAttempt> findByStudent(User student);
    
    boolean existsByQuizAndStudent(Quiz quiz, User student);
    
    List<QuizAttempt> findByQuizId(Long quizId);
    
    List<QuizAttempt> findByStudentId(Long studentId);
}
