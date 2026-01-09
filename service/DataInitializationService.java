package com.studenttrack.service;

import com.studenttrack.entity.ERole;
import com.studenttrack.entity.Role;
import com.studenttrack.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

@Service
public class DataInitializationService implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        // Initialize roles if they don't exist
        if (roleRepository.count() == 0) {
            Role hodRole = new Role(ERole.ROLE_HOD);
            Role facultyRole = new Role(ERole.ROLE_FACULTY);
            Role studentRole = new Role(ERole.ROLE_STUDENT);

            roleRepository.save(hodRole);
            roleRepository.save(facultyRole);
            roleRepository.save(studentRole);

            System.out.println("Roles initialized successfully!");
        }
    }
}