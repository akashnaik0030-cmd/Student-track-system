package com.studenttrack.service;

import com.studenttrack.dto.LiveClassDTO;
import com.studenttrack.entity.ClassEntity;
import com.studenttrack.entity.ERole;
import com.studenttrack.entity.LiveClass;
import com.studenttrack.entity.Notification;
import com.studenttrack.entity.User;
import com.studenttrack.repository.ClassRepository;
import com.studenttrack.repository.LiveClassRepository;
import com.studenttrack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LiveClassService {

    @Autowired
    private LiveClassRepository liveClassRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClassRepository classRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Transactional
    public LiveClass createLiveClass(LiveClassDTO liveClassDTO, Long facultyId) {
        User faculty = userRepository.findById(facultyId)
            .orElseThrow(() -> new RuntimeException("Faculty not found"));
        
        LiveClass liveClass = new LiveClass();
        liveClass.setTitle(liveClassDTO.getTitle());
        liveClass.setDescription(liveClassDTO.getDescription());
        liveClass.setSubject(liveClassDTO.getSubject());
        liveClass.setScheduledAt(liveClassDTO.getScheduledAt());
        liveClass.setDurationMinutes(liveClassDTO.getDurationMinutes());
        liveClass.setPlatform(liveClassDTO.getPlatform());
        liveClass.setMeetingUrl(liveClassDTO.getMeetingUrl());
        liveClass.setMeetingId(liveClassDTO.getMeetingId());
        liveClass.setMeetingPassword(liveClassDTO.getMeetingPassword());
        liveClass.setFaculty(faculty);
        
        // Set ClassEntity if classId is provided
        if (liveClassDTO.getClassId() != null) {
            ClassEntity classEntity = classRepository.findById(liveClassDTO.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));
            liveClass.setClassEntity(classEntity);
        }
        
        LiveClass savedClass = liveClassRepository.save(liveClass);
        
        // Notify students
        notifyStudentsAboutLiveClass(savedClass, faculty);
        
        return savedClass;
    }

    private void notifyStudentsAboutLiveClass(LiveClass liveClass, User faculty) {
        List<User> students;
        
        if (liveClass.getClassEntity() != null) {
            // Get all students and filter by class
            students = userRepository.findByRoleName(com.studenttrack.entity.ERole.ROLE_STUDENT)
                .stream()
                .filter(user -> user.getClassEntity() != null && 
                        user.getClassEntity().getId().equals(liveClass.getClassEntity().getId()))
                .collect(Collectors.toList());
        } else {
            students = userRepository.findByRoleName(com.studenttrack.entity.ERole.ROLE_STUDENT);
        }
        
        if (!students.isEmpty()) {
            String title = "Live Class Scheduled: " + liveClass.getSubject();
            String message = String.format("'%s' scheduled for %s by %s",
                liveClass.getTitle(),
                liveClass.getScheduledAt().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm")),
                faculty.getFullName());
            
            notificationService.createNotificationForMultipleUsers(
                students, title, message,
                Notification.NotificationType.LIVE_CLASS_SCHEDULED,
                liveClass.getId()
            );
            
            List<String> emails = students.stream()
                .map(User::getEmail)
                .collect(Collectors.toList());
            
            emailService.sendLiveClassScheduledEmail(
                emails,
                liveClass.getTitle(),
                liveClass.getScheduledAt().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm")),
                liveClass.getMeetingUrl(),
                faculty.getFullName()
            );
        }
    }

    public List<LiveClass> getAllLiveClasses() {
        return liveClassRepository.findAll();
    }

    public List<LiveClass> getLiveClassesByFaculty(Long facultyId) {
        return liveClassRepository.findByFacultyIdOrderByScheduledAtDesc(facultyId);
    }

    public List<LiveClass> getLiveClassesByClass(Long classId) {
        return liveClassRepository.findByClassEntityIdOrderByScheduledAtDesc(classId);
    }

    public List<LiveClass> getLiveClassesByStatus(LiveClass.Status status) {
        return liveClassRepository.findByStatusOrderByScheduledAtDesc(status);
    }

    public List<LiveClass> getUpcomingLiveClasses() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime futureDate = now.plusDays(30);
        return liveClassRepository.findByScheduledAtBetweenOrderByScheduledAtAsc(now, futureDate);
    }

    public List<LiveClass> getUpcomingLiveClassesForClass(Long classId) {
        return liveClassRepository.findByClassEntityIdAndStatusOrderByScheduledAtDesc(
            classId, LiveClass.Status.SCHEDULED);
    }

    public Optional<LiveClass> getLiveClassById(Long id) {
        return liveClassRepository.findById(id);
    }

    @Transactional
    public LiveClass updateLiveClass(Long id, LiveClassDTO liveClassDTO) {
        LiveClass liveClass = liveClassRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Live class not found"));
        
        liveClass.setTitle(liveClassDTO.getTitle());
        liveClass.setDescription(liveClassDTO.getDescription());
        liveClass.setSubject(liveClassDTO.getSubject());
        liveClass.setScheduledAt(liveClassDTO.getScheduledAt());
        liveClass.setDurationMinutes(liveClassDTO.getDurationMinutes());
        liveClass.setPlatform(liveClassDTO.getPlatform());
        liveClass.setMeetingUrl(liveClassDTO.getMeetingUrl());
        liveClass.setMeetingId(liveClassDTO.getMeetingId());
        liveClass.setMeetingPassword(liveClassDTO.getMeetingPassword());
        
        // Update ClassEntity if classId is provided
        if (liveClassDTO.getClassId() != null) {
            ClassEntity classEntity = classRepository.findById(liveClassDTO.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));
            liveClass.setClassEntity(classEntity);
        } else {
            liveClass.setClassEntity(null);
        }
        
        return liveClassRepository.save(liveClass);
    }

    @Transactional
    public LiveClass updateStatus(Long id, LiveClass.Status status) {
        LiveClass liveClass = liveClassRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Live class not found"));
        
        liveClass.setStatus(status);
        return liveClassRepository.save(liveClass);
    }

    @Transactional
    public LiveClass addRecording(Long id, String recordingUrl) {
        LiveClass liveClass = liveClassRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Live class not found"));
        
        liveClass.setRecordingUrl(recordingUrl);
        liveClass.setStatus(LiveClass.Status.COMPLETED);
        return liveClassRepository.save(liveClass);
    }

    @Transactional
    public void deleteLiveClass(Long id) {
        liveClassRepository.deleteById(id);
    }
}
