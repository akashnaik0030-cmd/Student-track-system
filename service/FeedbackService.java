package com.studenttrack.service;

import com.studenttrack.dto.FeedbackDTO;
import com.studenttrack.dto.FeedbackRequest;
import com.studenttrack.entity.Feedback;
import com.studenttrack.entity.Task;
import com.studenttrack.entity.User;
import com.studenttrack.repository.FeedbackRepository;
import com.studenttrack.repository.TaskRepository;
import com.studenttrack.repository.UserRepository;
import com.studenttrack.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    public FeedbackDTO createFeedback(Long taskId, Long studentId, FeedbackRequest feedbackRequest) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Feedback feedback = new Feedback(
                feedbackRequest.getContent(),
                task,
                faculty,
                student
        );

        Feedback savedFeedback = feedbackRepository.save(feedback);
        return convertToDTO(savedFeedback);
    }

    public List<FeedbackDTO> getFeedbackByTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        List<Feedback> feedbacks = feedbackRepository.findByTask(task);
        return feedbacks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<FeedbackDTO> getFeedbackByStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        List<Feedback> feedbacks = feedbackRepository.findByStudent(student);
        return feedbacks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<FeedbackDTO> getFeedbackByFaculty() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
        List<Feedback> feedbacks = feedbackRepository.findByFaculty(faculty);
        return feedbacks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public FeedbackDTO getFeedbackById(Long feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
        return convertToDTO(feedback);
    }

    private FeedbackDTO convertToDTO(Feedback feedback) {
        FeedbackDTO dto = new FeedbackDTO();
        dto.setId(feedback.getId());
        dto.setContent(feedback.getContent());
        
        if (feedback.getTask() != null) {
            dto.setTaskId(feedback.getTask().getId());
            dto.setTaskTitle(feedback.getTask().getTitle());
        }
        
        if (feedback.getFaculty() != null) {
            dto.setFacultyId(feedback.getFaculty().getId());
            dto.setFacultyName(feedback.getFaculty().getFullName());
        }
        
        if (feedback.getStudent() != null) {
            dto.setStudentId(feedback.getStudent().getId());
            dto.setStudentName(feedback.getStudent().getFullName());
        }
        
        dto.setCreatedAt(feedback.getCreatedAt());
        
        return dto;
    }
}