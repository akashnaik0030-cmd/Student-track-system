package com.studenttrack.repository;

import com.studenttrack.entity.Resource;
import com.studenttrack.entity.Resource.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findBySubjectOrderByCreatedAtDesc(String subject);
    
    List<Resource> findByTypeOrderByCreatedAtDesc(ResourceType type);
    
    List<Resource> findByClassEntityIdOrderByCreatedAtDesc(Long classId);
    
    List<Resource> findByIsPublicTrueOrderByCreatedAtDesc();
    
    List<Resource> findByUploadedByIdOrderByCreatedAtDesc(Long uploaderId);
}
