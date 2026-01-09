package com.studenttrack.repository;

import com.studenttrack.entity.Quiz;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    @EntityGraph(attributePaths = {"faculty", "questions", "questions.options"})
    List<Quiz> findByFacultyId(Long facultyId);

    @Override
    @EntityGraph(attributePaths = {"faculty", "questions", "questions.options"})
    List<Quiz> findAll();

    @EntityGraph(attributePaths = {"faculty", "questions", "questions.options"})
    Optional<Quiz> findById(Long id);
}