package com.studenttrack.service;

import com.studenttrack.entity.ClassEntity;
import com.studenttrack.entity.ERole;
import com.studenttrack.entity.Notification;
import com.studenttrack.entity.Resource;
import com.studenttrack.entity.User;
import com.studenttrack.repository.ClassRepository;
import com.studenttrack.repository.ResourceRepository;
import com.studenttrack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClassRepository classRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Transactional
    public Resource createResource(Resource resource, MultipartFile file, Long uploaderId) throws Exception {
        User uploader = userRepository.findById(uploaderId)
            .orElseThrow(() -> new RuntimeException("Uploader not found"));
        
        resource.setUploadedBy(uploader);
        
        if (file != null && !file.isEmpty()) {
            String filePath = fileStorageService.storeFile(file);
            resource.setFilePath(filePath);
            resource.setFileName(file.getOriginalFilename());
            resource.setFileSize(file.getSize());
        }
        
        Resource savedResource = resourceRepository.save(resource);
        
        // Send notifications
        notifyStudentsAboutResource(savedResource, uploader);
        
        return savedResource;
    }

    private void notifyStudentsAboutResource(Resource resource, User uploader) {
        List<User> students;
        
        if (resource.getClassEntity() != null) {
            // Get all students and filter by class
            students = userRepository.findByRoleName(com.studenttrack.entity.ERole.ROLE_STUDENT)
                .stream()
                .filter(user -> user.getClassEntity() != null && 
                        user.getClassEntity().getId().equals(resource.getClassEntity().getId()))
                .collect(Collectors.toList());
        } else {
            students = userRepository.findByRoleName(com.studenttrack.entity.ERole.ROLE_STUDENT);
        }
        
        if (!students.isEmpty()) {
            String title = "New Resource: " + resource.getSubject();
            String message = String.format("'%s' has been added by %s",
                resource.getTitle(), uploader.getFullName());
            
            notificationService.createNotificationForMultipleUsers(
                students, title, message,
                Notification.NotificationType.RESOURCE_ADDED,
                resource.getId()
            );
            
            List<String> emails = students.stream()
                .map(User::getEmail)
                .collect(Collectors.toList());
            
            emailService.sendResourceAddedEmail(emails, resource.getTitle(),
                resource.getSubject(), uploader.getFullName());
        }
    }

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public List<Resource> getPublicResources() {
        return resourceRepository.findByIsPublicTrueOrderByCreatedAtDesc();
    }

    public List<Resource> getResourcesBySubject(String subject) {
        return resourceRepository.findBySubjectOrderByCreatedAtDesc(subject);
    }

    public List<Resource> getResourcesByType(Resource.ResourceType type) {
        return resourceRepository.findByTypeOrderByCreatedAtDesc(type);
    }

    public List<Resource> getResourcesByClass(Long classId) {
        return resourceRepository.findByClassEntityIdOrderByCreatedAtDesc(classId);
    }

    public List<Resource> getResourcesByUploader(Long uploaderId) {
        return resourceRepository.findByUploadedByIdOrderByCreatedAtDesc(uploaderId);
    }

    public Optional<Resource> getResourceById(Long id) {
        return resourceRepository.findById(id);
    }

    @Transactional
    public Resource updateResource(Long id, Resource updatedResource) {
        Resource resource = resourceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Resource not found"));
        
        resource.setTitle(updatedResource.getTitle());
        resource.setDescription(updatedResource.getDescription());
        resource.setType(updatedResource.getType());
        resource.setSubject(updatedResource.getSubject());
        resource.setUrl(updatedResource.getUrl());
        resource.setIsPublic(updatedResource.getIsPublic());
        
        if (updatedResource.getClassEntity() != null) {
            resource.setClassEntity(updatedResource.getClassEntity());
        }
        
        return resourceRepository.save(resource);
    }

    @Transactional
    public void incrementDownloadCount(Long id) {
        resourceRepository.findById(id).ifPresent(resource -> {
            resource.incrementDownloadCount();
            resourceRepository.save(resource);
        });
    }

    @Transactional
    public void deleteResource(Long id) {
        resourceRepository.deleteById(id);
    }
}
