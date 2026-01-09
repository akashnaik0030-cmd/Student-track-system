package com.studenttrack.service;

import com.studenttrack.dto.AttendanceDTO;
import com.studenttrack.dto.AttendanceRequest;
import com.studenttrack.dto.AttendanceSummaryDTO;
import com.studenttrack.entity.Attendance;
import com.studenttrack.entity.AttendanceStatus;
import com.studenttrack.entity.ERole;
import com.studenttrack.entity.Role;
import com.studenttrack.entity.User;
import com.studenttrack.repository.AttendanceRepository;
import com.studenttrack.repository.RoleRepository;
import com.studenttrack.repository.UserRepository;
import com.studenttrack.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuthService authService;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public List<Attendance> markAttendance(AttendanceRequest attendanceRequest) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Verify user has faculty role - only faculty can mark attendance
        Role facultyRole = roleRepository.findByName(ERole.ROLE_FACULTY)
                .orElseThrow(() -> new RuntimeException("Faculty role not found"));
        if (!faculty.getRoles().contains(facultyRole)) {
            throw new RuntimeException("Only faculty members can mark attendance. HOD cannot mark attendance.");
        }

        List<Attendance> attendanceList = new ArrayList<>();

        for (Map.Entry<Long, AttendanceStatus> entry : attendanceRequest.getStudentAttendance().entrySet()) {
            Long studentId = entry.getKey();
            AttendanceStatus status = entry.getValue();

            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));

            // Check if attendance already exists for this date, student, and faculty
            // Each faculty has their own attendance sheet for the same student on same date
            Optional<Attendance> existingAttendance = attendanceRepository
                    .findByDateAndStudentAndFaculty(attendanceRequest.getDate(), student, faculty);

            Attendance attendance;
            if (existingAttendance.isPresent()) {
                attendance = existingAttendance.get();
                // Verify this faculty owns this attendance record
                if (!attendance.getFaculty().getId().equals(faculty.getId())) {
                    throw new RuntimeException("You can only modify attendance records you created");
                }
                attendance.setStatus(status);
                if (attendanceRequest.getRemarks() != null) {
                    attendance.setRemarks(attendanceRequest.getRemarks());
                }
                if (attendanceRequest.getSubject() != null && !attendanceRequest.getSubject().isBlank()) {
                    attendance.setSubject(attendanceRequest.getSubject());
                }
                attendanceList.add(attendanceRepository.save(attendance));
            } else {
                // Create new attendance record
                attendance = new Attendance(attendanceRequest.getDate(), student, faculty, status);
                if (attendanceRequest.getRemarks() != null) {
                    attendance.setRemarks(attendanceRequest.getRemarks());
                }
                if (attendanceRequest.getSubject() != null && !attendanceRequest.getSubject().isBlank()) {
                    attendance.setSubject(attendanceRequest.getSubject());
                }
                
                try {
                    attendanceList.add(attendanceRepository.save(attendance));
                } catch (DataIntegrityViolationException e) {
                    // Clear the persistence context to remove the invalid entity state
                    entityManager.clear();
                    
                    // Handle race condition: if another request created the record concurrently, fetch and update it
                    Optional<Attendance> retryAttendance = attendanceRepository
                            .findByDateAndStudentAndFaculty(attendanceRequest.getDate(), student, faculty);
                    if (retryAttendance.isPresent()) {
                        attendance = retryAttendance.get();
                        // Verify this faculty owns the record
                        if (!attendance.getFaculty().getId().equals(faculty.getId())) {
                            throw new RuntimeException("Attendance record exists for this student and date but belongs to a different faculty");
                        }
                        attendance.setStatus(status);
                        if (attendanceRequest.getRemarks() != null) {
                            attendance.setRemarks(attendanceRequest.getRemarks());
                        }
                        if (attendanceRequest.getSubject() != null && !attendanceRequest.getSubject().isBlank()) {
                            attendance.setSubject(attendanceRequest.getSubject());
                        }
                        attendanceList.add(attendanceRepository.save(attendance));
                    } else {
                        // If still not found, there might be a database constraint issue
                        throw new RuntimeException("Failed to save attendance: Duplicate entry detected. This may indicate a database constraint mismatch. Please run the SQL script to fix the constraint. " + e.getMessage());
                    }
                }
            }
        }

        return attendanceList;
    }

    public List<AttendanceDTO> getAttendanceByDate(LocalDate date) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Faculty sees only their own attendance records
        List<Attendance> allAttendance = attendanceRepository.findByDate(date);
        List<Attendance> attendanceList = allAttendance.stream()
                .filter(a -> a.getFaculty().getId().equals(faculty.getId()))
                .collect(Collectors.toList());
        
        return attendanceList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<AttendanceDTO> getAllAttendanceByDateForHOD(LocalDate date) {
        // HOD sees all attendance records from all faculty for the date
        List<Attendance> attendanceList = attendanceRepository.findByDateWithUsers(date);
        return attendanceList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByStudentAndMonth(Long studentId, int year, int month) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Attendance> attendanceList = attendanceRepository
                .findByStudentAndDateBetween(student, startDate, endDate);

        return attendanceList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByFacultyAndMonth(Long facultyId, int year, int month) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Attendance> attendanceList = attendanceRepository
                .findByFacultyAndDateBetween(faculty, startDate, endDate);

        return attendanceList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceSummaryDTO> getAttendanceSummary(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // Get all students
        List<User> students = userRepository.findAll().stream()
                .filter(user -> user.getRoles().stream()
                        .anyMatch(role -> role.getName().name().equals("ROLE_STUDENT")))
                .collect(Collectors.toList());

        List<AttendanceSummaryDTO> summaryList = new ArrayList<>();

        for (User student : students) {
            AttendanceSummaryDTO summary = new AttendanceSummaryDTO();
            summary.setStudentId(student.getId());
            summary.setStudentName(student.getFullName());

            Map<AttendanceStatus, Long> statusCounts = new HashMap<>();
            for (AttendanceStatus status : AttendanceStatus.values()) {
                Long count = attendanceRepository.countByStudentAndStatusAndDateRange(
                        student, status, startDate, endDate);
                statusCounts.put(status, count);
            }

            Long totalDays = statusCounts.values().stream()
                    .mapToLong(Long::longValue)
                    .sum();

            summary.setStatusCounts(statusCounts);
            summary.setTotalDays(totalDays);

            // Calculate attendance percentage (PRESENT + EXCUSED / Total)
            long presentAndExcused = statusCounts.getOrDefault(AttendanceStatus.PRESENT, 0L) +
                    statusCounts.getOrDefault(AttendanceStatus.EXCUSED, 0L);
            double percentage = totalDays > 0 ? (presentAndExcused * 100.0 / totalDays) : 0.0;
            summary.setAttendancePercentage(Math.round(percentage * 100.0) / 100.0);

            summaryList.add(summary);
        }

        return summaryList;
    }

    public List<AttendanceDTO> getMyAttendance(int year, int month) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User student = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return getAttendanceByStudentAndMonth(student.getId(), year, month);
    }

    public List<AttendanceDTO> getAttendanceForCurrentDate(LocalDate date) {
        List<Attendance> attendanceList = attendanceRepository.findByDate(date);
        return attendanceList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceForMonth(int year, int month) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // Faculty sees only their own attendance records
        List<Attendance> allAttendance = attendanceRepository.findByDateRange(startDate, endDate);
        List<Attendance> attendanceList = allAttendance.stream()
                .filter(a -> a.getFaculty().getId().equals(faculty.getId()))
                .collect(Collectors.toList());
        
        return attendanceList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<AttendanceDTO> getAllAttendanceForMonthForHOD(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // HOD sees all attendance records from all faculty
        List<Attendance> attendanceList = attendanceRepository.findByDateRangeWithUsers(startDate, endDate);
        return attendanceList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<AttendanceDTO> getAttendanceByFacultyAndDateRange(Long facultyId, int year, int month) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Attendance> attendanceList = attendanceRepository
                .findByFacultyAndDateBetweenWithUsers(faculty, startDate, endDate);

        return attendanceList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private AttendanceDTO convertToDTO(Attendance attendance) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setId(attendance.getId());
        dto.setDate(attendance.getDate());
        if (attendance.getStudent() != null) {
            dto.setStudentId(attendance.getStudent().getId());
            dto.setStudentName(attendance.getStudent().getFullName());
            dto.setStudentRollNumber(attendance.getStudent().getRollNumber());
        }
        if (attendance.getFaculty() != null) {
            dto.setFacultyId(attendance.getFaculty().getId());
            dto.setFacultyName(attendance.getFaculty().getFullName());
        }
        dto.setStatus(attendance.getStatus());
        dto.setRemarks(attendance.getRemarks());
        dto.setCreatedAt(attendance.getCreatedAt());
        return dto;
    }
}


