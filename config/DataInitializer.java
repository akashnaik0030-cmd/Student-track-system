package com.studenttrack.config;

import com.studenttrack.entity.Role;
import com.studenttrack.entity.User;
import com.studenttrack.repository.RoleRepository;
import com.studenttrack.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

@Configuration
public class DataInitializer {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CommandLineRunner initDefaultUsers(UserRepository userRepository,
                                              RoleRepository roleRepository,
                                              PasswordEncoder passwordEncoder) {
        return args -> {
            // Ensure roles exist
            Role hodRole = roleRepository.findByName("ROLE_HOD").orElseGet(() -> {
                Role r = new Role();
                r.setName("ROLE_HOD");
                return roleRepository.save(r);
            });
            Role facultyRole = roleRepository.findByName("ROLE_FACULTY").orElseGet(() -> {
                Role r = new Role();
                r.setName("ROLE_FACULTY");
                return roleRepository.save(r);
            });
            Role studentRole = roleRepository.findByName("ROLE_STUDENT").orElseGet(() -> {
                Role r = new Role();
                r.setName("ROLE_STUDENT");
                return roleRepository.save(r);
            });

            // Ensure HOD user exists
            Optional<User> hodOpt = userRepository.findByUsername("hod");
            if (hodOpt.isEmpty()) {
                User hod = new User();
                hod.setUsername("hod");
                hod.setEmail("hod@example.com");
                hod.setPassword(passwordEncoder.encode("password123"));
                hod.setEnabled(true);
                hod.setRoles(Collections.singleton(hodRole));
                userRepository.save(hod);
                System.out.println("[DataInitializer] Created default HOD user 'hod' with password 'password123'.");
            }

            // Ensure Faculty user exists
            Optional<User> facultyOpt = userRepository.findByUsername("faculty1");
            if (facultyOpt.isEmpty()) {
                User faculty = new User();
                faculty.setUsername("faculty1");
                faculty.setEmail("faculty1@example.com");
                faculty.setPassword(passwordEncoder.encode("password123"));
                faculty.setEnabled(true);
                faculty.setRoles(Collections.singleton(facultyRole));
                userRepository.save(faculty);
                System.out.println("[DataInitializer] Created default Faculty user 'faculty1' with password 'password123'.");
            }

            // Ensure Student users exist
            Optional<User> student1Opt = userRepository.findByUsername("student1");
            if (student1Opt.isEmpty()) {
                User student1 = new User();
                student1.setUsername("student1");
                student1.setEmail("student1@example.com");
                student1.setPassword(passwordEncoder.encode("password123"));
                student1.setEnabled(true);
                student1.setRoles(Collections.singleton(studentRole));
                userRepository.save(student1);
                System.out.println("[DataInitializer] Created default Student user 'student1' with password 'password123'.");
            }

            Optional<User> student2Opt = userRepository.findByUsername("student2");
            if (student2Opt.isEmpty()) {
                User student2 = new User();
                student2.setUsername("student2");
                student2.setEmail("student2@example.com");
                student2.setPassword(passwordEncoder.encode("password123"));
                student2.setEnabled(true);
                student2.setRoles(Collections.singleton(studentRole));
                userRepository.save(student2);
                System.out.println("[DataInitializer] Created default Student user 'student2' with password 'password123'.");
            }
        };
    }
}
