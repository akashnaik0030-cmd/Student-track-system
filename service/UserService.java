package com.studenttrack.service;

import com.studenttrack.dto.UserResponseDTO;
import com.studenttrack.dto.UserUpdateRequestDTO;
import com.studenttrack.dto.StudentCreateRequest;
import com.studenttrack.dto.FacultyCreateRequest;
import com.studenttrack.entity.ERole;
import com.studenttrack.entity.Role;
import com.studenttrack.entity.User;
import com.studenttrack.repository.RoleRepository;
import com.studenttrack.repository.UserRepository;
import com.studenttrack.repository.NoteRepository;
import com.studenttrack.repository.TaskRepository;
import com.studenttrack.repository.SubmissionRepository;
import com.studenttrack.repository.FeedbackRepository;
import com.studenttrack.repository.AttendanceRepository;
import com.studenttrack.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private com.studenttrack.repository.AssessmentTypeRepository assessmentTypeRepository;

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::convertToUserResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponseDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return convertToUserResponseDTO(user);
    }

    @Transactional(readOnly = true)
    public UserResponseDTO getCurrentUserProfile() {
        UserPrincipal currentUser = authService.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToUserResponseDTO(user);
    }

    @Transactional
    public UserResponseDTO updateUserProfile(UserUpdateRequestDTO updateRequest) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update email if provided and not already taken
        if (updateRequest.getEmail() != null && !updateRequest.getEmail().isEmpty()) {
            if (!user.getEmail().equals(updateRequest.getEmail()) && 
                userRepository.existsByEmail(updateRequest.getEmail())) {
                throw new RuntimeException("Error: Email is already in use!");
            }
            user.setEmail(updateRequest.getEmail());
        }

        // Update full name if provided
        if (updateRequest.getFullName() != null && !updateRequest.getFullName().isEmpty()) {
            user.setFullName(updateRequest.getFullName());
        }

        // Update password if provided
        if (updateRequest.getNewPassword() != null && !updateRequest.getNewPassword().isEmpty()) {
            if (updateRequest.getCurrentPassword() == null || updateRequest.getCurrentPassword().isEmpty()) {
                throw new RuntimeException("Error: Current password is required to change password!");
            }
            
            // Verify current password
            if (!passwordEncoder.matches(updateRequest.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Error: Current password is incorrect!");
            }
            
            user.setPassword(passwordEncoder.encode(updateRequest.getNewPassword()));
        }

        User updatedUser = userRepository.save(user);
        return convertToUserResponseDTO(updatedUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Delete or handle related records first to avoid foreign key constraint violations
        
        // Delete notes created by this user
        List<com.studenttrack.entity.Note> notesCreatedBy = noteRepository.findByCreatedBy(user);
        noteRepository.deleteAll(notesCreatedBy);
        
        // Delete notes assigned to this user
        List<com.studenttrack.entity.Note> notesAssignedTo = noteRepository.findByAssignedTo(user);
        noteRepository.deleteAll(notesAssignedTo);

        // Get tasks assigned by this user
        List<com.studenttrack.entity.Task> tasksAssignedBy = taskRepository.findByAssignedBy(user);
        for (com.studenttrack.entity.Task task : tasksAssignedBy) {
            // Delete submissions for this task
            List<com.studenttrack.entity.Submission> submissions = submissionRepository.findByTask(task);
            submissionRepository.deleteAll(submissions);
            
            // Delete feedback for this task
            List<com.studenttrack.entity.Feedback> feedbacks = feedbackRepository.findByTask(task);
            feedbackRepository.deleteAll(feedbacks);
            
            // Delete the task
            taskRepository.delete(task);
        }

        // Get tasks assigned to this user
        List<com.studenttrack.entity.Task> tasksAssignedTo = taskRepository.findByAssignedTo(user);
        for (com.studenttrack.entity.Task task : tasksAssignedTo) {
            // Delete submissions for this task
            List<com.studenttrack.entity.Submission> submissions = submissionRepository.findByTask(task);
            submissionRepository.deleteAll(submissions);
            
            // Delete feedback for this task
            List<com.studenttrack.entity.Feedback> feedbacks = feedbackRepository.findByTask(task);
            feedbackRepository.deleteAll(feedbacks);
            
            // Delete the task
            taskRepository.delete(task);
        }

        // Delete submissions by this user (as student)
        List<com.studenttrack.entity.Submission> studentSubmissions = submissionRepository.findByStudent(user);
        submissionRepository.deleteAll(studentSubmissions);

        // Delete feedback by this user (as faculty)
        List<com.studenttrack.entity.Feedback> facultyFeedbacks = feedbackRepository.findByFaculty(user);
        feedbackRepository.deleteAll(facultyFeedbacks);
        
        // Delete feedback for this user (as student)
        List<com.studenttrack.entity.Feedback> studentFeedbacks = feedbackRepository.findByStudent(user);
        feedbackRepository.deleteAll(studentFeedbacks);

        // Delete attendance records for this user (as student)
        List<com.studenttrack.entity.Attendance> studentAttendances = attendanceRepository.findByStudent(user);
        attendanceRepository.deleteAll(studentAttendances);
        
        // Delete attendance records marked by this user (as faculty)
        List<com.studenttrack.entity.Attendance> facultyAttendances = attendanceRepository.findByFaculty(user);
        attendanceRepository.deleteAll(facultyAttendances);

        // Delete assessment types created by this user to avoid FK constraint
        List<com.studenttrack.entity.AssessmentType> assessmentTypes = assessmentTypeRepository.findByCreatedBy(user);
        if (assessmentTypes != null && !assessmentTypes.isEmpty()) {
            assessmentTypeRepository.deleteAll(assessmentTypes);
        }

        // Now safe to delete the user
        userRepository.delete(user);
    }

    public List<UserResponseDTO> getUsersByRole(String roleName) {
        ERole role = ERole.valueOf("ROLE_" + roleName.toUpperCase());
        Role roleEntity = roleRepository.findByName(role)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        
        List<User> users = userRepository.findAll().stream()
                .filter(user -> user.getRoles().contains(roleEntity))
                .collect(Collectors.toList());
        
        return users.stream()
                .map(this::convertToUserResponseDTO)
                .collect(Collectors.toList());
    }

    public UserResponseDTO assignRoleToUser(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        ERole role = ERole.valueOf("ROLE_" + roleName.toUpperCase());
        Role roleEntity = roleRepository.findByName(role)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        
        user.getRoles().add(roleEntity);
        User updatedUser = userRepository.save(user);
        return convertToUserResponseDTO(updatedUser);
    }

    public UserResponseDTO removeRoleFromUser(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        ERole role = ERole.valueOf("ROLE_" + roleName.toUpperCase());
        Role roleEntity = roleRepository.findByName(role)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        
        user.getRoles().remove(roleEntity);
        User updatedUser = userRepository.save(user);
        return convertToUserResponseDTO(updatedUser);
    }

    public UserResponseDTO createStudent(StudentCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Check if roll number already exists
        if (request.getRollNumber() != null && !request.getRollNumber().trim().isEmpty()) {
            boolean rollNumberExists = userRepository.findAll().stream()
                    .anyMatch(user -> request.getRollNumber().trim().equalsIgnoreCase(user.getRollNumber()));
            if (rollNumberExists) {
                throw new RuntimeException("Error: Roll number is already in use!");
            }
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName()
        );

        if (request.getRollNumber() != null && !request.getRollNumber().trim().isEmpty()) {
            user.setRollNumber(request.getRollNumber().trim());
        }

        Role studentRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                .orElseThrow(() -> new RuntimeException("Error: Student role not found."));
        user.getRoles().add(studentRole);

        User savedUser = userRepository.save(user);
        return convertToUserResponseDTO(savedUser);
    }

    public UserResponseDTO createFaculty(FacultyCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName()
        );

    if (request.getSubject() != null && !request.getSubject().trim().isEmpty()) {
        user.setSubject(request.getSubject().trim());
    }

        Role facultyRole = roleRepository.findByName(ERole.ROLE_FACULTY)
                .orElseThrow(() -> new RuntimeException("Error: Faculty role not found."));
        user.getRoles().add(facultyRole);

        User savedUser = userRepository.save(user);
        return convertToUserResponseDTO(savedUser);
    }

    public UserResponseDTO updateUserById(Long id, UserUpdateRequestDTO updateRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Update email if provided and not already taken
        if (updateRequest.getEmail() != null && !updateRequest.getEmail().isEmpty()) {
            if (!user.getEmail().equals(updateRequest.getEmail()) && 
                userRepository.existsByEmail(updateRequest.getEmail())) {
                throw new RuntimeException("Error: Email is already in use!");
            }
            user.setEmail(updateRequest.getEmail());
        }

        // Update full name if provided
        if (updateRequest.getFullName() != null && !updateRequest.getFullName().isEmpty()) {
            user.setFullName(updateRequest.getFullName());
        }

        // Update roll number if provided
        if (updateRequest.getRollNumber() != null && !updateRequest.getRollNumber().trim().isEmpty()) {
            // Check if roll number is already in use by another user
            boolean rollNumberExists = userRepository.findAll().stream()
                    .anyMatch(u -> !u.getId().equals(id) && 
                            updateRequest.getRollNumber().trim().equalsIgnoreCase(u.getRollNumber()));
            if (rollNumberExists) {
                throw new RuntimeException("Error: Roll number is already in use!");
            }
            user.setRollNumber(updateRequest.getRollNumber().trim());
        } else if (updateRequest.getRollNumber() != null && updateRequest.getRollNumber().trim().isEmpty()) {
            // Allow clearing roll number
            user.setRollNumber(null);
        }

        // Update password if provided (admin can change without current password)
        if (updateRequest.getNewPassword() != null && !updateRequest.getNewPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updateRequest.getNewPassword()));
        }

        User updatedUser = userRepository.save(user);
        return convertToUserResponseDTO(updatedUser);
    }

    private UserResponseDTO convertToUserResponseDTO(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(role -> role.getName().name().substring(5)) // Remove "ROLE_" prefix
                .collect(Collectors.toSet());
        
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRollNumber(),
                roleNames
        );
    }
}
