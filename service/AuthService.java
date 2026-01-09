package com.studenttrack.service;

import com.studenttrack.dto.LoginRequest;
import com.studenttrack.dto.SignupRequest;
import com.studenttrack.entity.ERole;
import com.studenttrack.entity.Role;
import com.studenttrack.entity.User;
import com.studenttrack.repository.RoleRepository;
import com.studenttrack.repository.UserRepository;
import com.studenttrack.security.JwtUtils;
import com.studenttrack.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Set;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    public String authenticateUser(LoginRequest loginRequest) {
        if (loginRequest == null || loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
            throw new RuntimeException("Login request or credentials cannot be null");
        }

        // First, check if user exists
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + loginRequest.getUsername()));

        // Enhanced logging for debugging
        logger.info("Login attempt - Username: '{}'", loginRequest.getUsername());
        logger.debug("Password details - Raw length: {}, Has whitespace: {}, Stored hash present: {}", 
                loginRequest.getPassword().length(),
                loginRequest.getPassword().matches(".*\\s.*"),
                user.getPassword() != null);

        // Trim password and check if empty
        String password = loginRequest.getPassword().trim();
        if (password.isEmpty()) {
            throw new RuntimeException("Password cannot be empty");
        }
        // Verify password with detailed logging
        boolean matches = false;
        try {
            matches = encoder.matches(password, user.getPassword());
            logger.debug("Password verification completed - Result: {}", matches);
        } catch (Exception e) {
            logger.error("Error during password verification", e);
            throw new RuntimeException("Error verifying credentials");
        }

        if (!matches) {
            logger.warn("Password mismatch for user '{}'", loginRequest.getUsername());
            throw new RuntimeException("Invalid username or password");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), password));

            // Set the authentication in the SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate and return JWT token
            return jwtUtils.generateJwtToken(authentication);
        } catch (Exception e) {
            logger.error("Authentication failed after password match for user '{}': {}",
                    loginRequest.getUsername(), e.getMessage());
            throw e;
        }
    }

    public User registerUser(SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Create new user's account
        User user = new User(signUpRequest.getUsername(),
                signUpRequest.getEmail(),
                encoder.encode(signUpRequest.getPassword()),
                signUpRequest.getFullName());
        
        // Set roll number if provided (for students)
        if (signUpRequest.getRollNumber() != null && !signUpRequest.getRollNumber().trim().isEmpty()) {
            user.setRollNumber(signUpRequest.getRollNumber().trim());
        }

        Set<String> strRoles = signUpRequest.getRole();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null) {
            Role studentRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            roles.add(studentRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                    case "hod":
                        Role hodRole = roleRepository.findByName(ERole.ROLE_HOD)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(hodRole);
                        break;
                    case "faculty":
                        Role facultyRole = roleRepository.findByName(ERole.ROLE_FACULTY)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(facultyRole);
                        break;
                    case "student":
                        Role studentRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(studentRole);
                        break;
                    default:
                        Role defaultRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(defaultRole);
                }
            });
        }

        user.setRoles(roles);
        return userRepository.save(user);
    }

    public UserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) authentication.getPrincipal();
        }
        throw new RuntimeException("User not authenticated");
    }
}