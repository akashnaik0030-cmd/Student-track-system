package com.studenttrack.controller;

import com.studenttrack.dto.MessageResponse;
import com.studenttrack.dto.UserResponseDTO;
import com.studenttrack.dto.UserUpdateRequestDTO;
import com.studenttrack.dto.StudentCreateRequest;
import com.studenttrack.dto.FacultyCreateRequest;
import com.studenttrack.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import jakarta.validation.Valid;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('HOD') or hasRole('FACULTY')")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('HOD') or hasRole('FACULTY') or @userSecurity.isCurrentUser(#id)")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        UserResponseDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> getCurrentUserProfile() {
        UserResponseDTO user = userService.getCurrentUserProfile();
        return ResponseEntity.ok(user);
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> updateUserProfile(@Valid @RequestBody UserUpdateRequestDTO updateRequest) {
        UserResponseDTO updatedUser = userService.updateUserProfile(updateRequest);
        return ResponseEntity.ok(updatedUser);
    }


    @GetMapping("/role/{roleName}")
//    @PreAuthorize("hasRole('HOD') or hasRole('FACULTY')")
    public ResponseEntity<List<UserResponseDTO>> getUsersByRole(@PathVariable String roleName) {
        List<UserResponseDTO> users = userService.getUsersByRole(roleName);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/{userId}/roles/{roleName}")
//    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<UserResponseDTO> assignRoleToUser(@PathVariable Long userId, 
                                                           @PathVariable String roleName) {
        UserResponseDTO updatedUser = userService.assignRoleToUser(userId, roleName);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{userId}/roles/{roleName}")
//    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<UserResponseDTO> removeRoleFromUser(@PathVariable Long userId, 
                                                             @PathVariable String roleName) {
        UserResponseDTO updatedUser = userService.removeRoleFromUser(userId, roleName);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/faculty")
//    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<List<UserResponseDTO>> getAllFaculty() {
        List<UserResponseDTO> faculty = userService.getUsersByRole("faculty");
        return ResponseEntity.ok(faculty);
    }

    @PostMapping("/students")
//    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> createStudent(@Valid @RequestBody StudentCreateRequest request) {
        try {
            UserResponseDTO student = userService.createStudent(request);
            return ResponseEntity.ok(student);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/faculty")
//    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> createFaculty(@Valid @RequestBody FacultyCreateRequest request) {
        try {
            UserResponseDTO faculty = userService.createFaculty(request);
            return ResponseEntity.ok(faculty);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
//    @PreAuthorize("hasRole('HOD') or hasRole('FACULTY')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequestDTO updateRequest) {
        try {
            UserResponseDTO updatedUser = userService.updateUserById(id, updateRequest);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
//    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(new MessageResponse("User deleted successfully!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/students")
//    @PreAuthorize("hasRole('FACULTY') or hasRole('HOD')")
    public ResponseEntity<List<UserResponseDTO>> getAllStudents() {
        List<UserResponseDTO> students = userService.getUsersByRole("student");
        return ResponseEntity.ok(students);
    }
}

