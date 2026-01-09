package com.studenttrack.repository;

import com.studenttrack.entity.AssessmentType;
import com.studenttrack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentTypeRepository extends JpaRepository<AssessmentType, Long> {
    List<AssessmentType> findByCreatedBy(User createdBy);
    List<AssessmentType> findByIsActiveTrue();
    Optional<AssessmentType> findByName(String name);
    List<AssessmentType> findByCreatedByAndIsActiveTrue(User createdBy);
}
