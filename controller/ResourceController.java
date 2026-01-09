package com.studenttrack.controller;

import com.studenttrack.entity.Resource;
import com.studenttrack.entity.User;
import com.studenttrack.repository.UserRepository;
import com.studenttrack.security.UserPrincipal;
import com.studenttrack.service.AuthService;
import com.studenttrack.service.FileStorageService;
import com.studenttrack.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*")
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_FACULTY', 'ROLE_HOD')")
    public ResponseEntity<?> createResource(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("type") Resource.ResourceType type,
            @RequestParam("subject") String subject,
            @RequestParam(value = "classId", required = false) Long classId,
            @RequestParam(value = "url", required = false) String url,
            @RequestParam(value = "isPublic", defaultValue = "true") Boolean isPublic,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        try {
            UserPrincipal currentUser = authService.getCurrentUser();
            User uploader = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

            Resource resource = new Resource();
            resource.setTitle(title);
            resource.setDescription(description);
            resource.setType(type);
            resource.setSubject(subject);
            resource.setUrl(url);
            resource.setIsPublic(isPublic);

            Resource savedResource = resourceService.createResource(resource, file, uploader.getId());
            return ResponseEntity.ok(savedResource);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        return ResponseEntity.ok(resourceService.getPublicResources());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getResourceById(@PathVariable Long id) {
        return resourceService.getResourceById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/subject/{subject}")
    public ResponseEntity<List<Resource>> getResourcesBySubject(@PathVariable String subject) {
        return ResponseEntity.ok(resourceService.getResourcesBySubject(subject));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Resource>> getResourcesByType(@PathVariable Resource.ResourceType type) {
        return ResponseEntity.ok(resourceService.getResourcesByType(type));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Resource>> getResourcesByClass(@PathVariable Long classId) {
        return ResponseEntity.ok(resourceService.getResourcesByClass(classId));
    }

    @GetMapping("/my-resources")
    @PreAuthorize("hasAnyRole('ROLE_FACULTY', 'ROLE_HOD')")
    public ResponseEntity<List<Resource>> getMyResources() {
        UserPrincipal currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(resourceService.getResourcesByUploader(currentUser.getId()));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadResource(@PathVariable Long id) {
        try {
            Resource resource = resourceService.getResourceById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
            
            if (resource.getFilePath() != null) {
                org.springframework.core.io.Resource file = fileStorageService.loadFileAsResource(resource.getFilePath());
                resourceService.incrementDownloadCount(id);
                
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + resource.getFileName() + "\"")
                    .body(file);
            } else {
                return ResponseEntity.badRequest().body("No file attached");
            }
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FACULTY', 'ROLE_HOD')")
    public ResponseEntity<?> updateResource(@PathVariable Long id, @RequestBody Resource resource) {
        try {
            Resource updated = resourceService.updateResource(id, resource);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_FACULTY', 'ROLE_HOD')")
    public ResponseEntity<Map<String, String>> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Resource deleted successfully");
        return ResponseEntity.ok(response);
    }
}
