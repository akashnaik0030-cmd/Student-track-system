package com.studenttrack.controller;

import com.studenttrack.dto.JwtResponse;
import com.studenttrack.dto.LoginRequest;
import com.studenttrack.dto.MessageResponse;
import com.studenttrack.dto.SignupRequest;
import com.studenttrack.security.UserPrincipal;
import com.studenttrack.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;
    @Autowired
    private com.studenttrack.repository.UserRepository userRepository;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            String jwt = authService.authenticateUser(loginRequest);
            UserPrincipal userPrincipal = authService.getCurrentUser();
            
            List<String> roles = userPrincipal.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new JwtResponse(jwt,
                    userPrincipal.getId(),
                    userPrincipal.getUsername(),
                    userPrincipal.getEmail(),
                    userPrincipal.getFullName(),
                    roles));
        } catch(Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        try {
            authService.registerUser(signUpRequest);
            return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUser() {
        UserPrincipal userPrincipal = authService.getCurrentUser();

        // Load full user entity to return fields expected by the frontend (fullName, roles as strings)
        com.studenttrack.entity.User user = userRepository.findByUsername(userPrincipal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + userPrincipal.getUsername()));

        // Build a simple DTO to return
        com.studenttrack.dto.CurrentUserDTO dto = new com.studenttrack.dto.CurrentUserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRoles(user.getRoles().stream().map(r -> r.getName().name()).collect(java.util.stream.Collectors.toList()));

        return ResponseEntity.ok(dto);
    }
}