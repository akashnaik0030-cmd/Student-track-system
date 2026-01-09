package com.studenttrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.studenttrack.dto.AttendanceDTO;
import com.studenttrack.dto.AttendanceRequest;
import com.studenttrack.dto.AttendanceSummaryDTO;
import com.studenttrack.entity.Attendance;
import com.studenttrack.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping
    public ResponseEntity<?> markAttendance(@RequestBody String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            AttendanceRequest attendanceRequest = mapper.readValue(json, AttendanceRequest.class);
            
            // Log for debugging
            System.out.println("Received attendance request: date=" + attendanceRequest.getDate() + 
                             ", students=" + attendanceRequest.getStudentAttendance().size());

            List<Attendance> attendanceList = attendanceService.markAttendance(attendanceRequest);
            String message = "Attendance marked successfully for " + attendanceList.size() + " students!";
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            e.printStackTrace(); // Log full stack trace
            String errorMessage = "Error marking attendance: " + e.getMessage();
            if (e.getMessage() != null && e.getMessage().contains("Duplicate entry")) {
                errorMessage += "\n\nIMPORTANT: The database constraint needs to be fixed. " +
                              "Please run the SQL script: fix_constraint_simple.sql " +
                              "to allow multiple faculty to mark attendance for the same student on the same day.";
            }
            return ResponseEntity.badRequest().body(errorMessage);
        }
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<?> getAttendanceByDate(@PathVariable String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            List<AttendanceDTO> attendanceList = attendanceService.getAttendanceByDate(localDate);
            return ResponseEntity.ok(attendanceList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attendance: " + e.getMessage());
        }
    }
    
    @GetMapping("/hod/date/{date}")
    public ResponseEntity<?> getAllAttendanceByDateForHOD(@PathVariable String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            List<AttendanceDTO> attendanceList = attendanceService.getAllAttendanceByDateForHOD(localDate);
            return ResponseEntity.ok(attendanceList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attendance: " + e.getMessage());
        }
    }

    @GetMapping("/student/{studentId}/month/{year}/{month}")
    public ResponseEntity<?> getAttendanceByStudentAndMonth(
            @PathVariable Long studentId,
            @PathVariable int year,
            @PathVariable int month) {
        try {
            List<AttendanceDTO> attendanceList = attendanceService
                    .getAttendanceByStudentAndMonth(studentId, year, month);
            
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String json = mapper.writeValueAsString(attendanceList);
            return ResponseEntity.ok(json);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attendance: " + e.getMessage());
        }
    }

    @GetMapping("/faculty/{facultyId}/month/{year}/{month}")
    public ResponseEntity<?> getAttendanceByFacultyAndMonth(
            @PathVariable Long facultyId,
            @PathVariable int year,
            @PathVariable int month) {
        try {
            List<AttendanceDTO> attendanceList = attendanceService
                    .getAttendanceByFacultyAndMonth(facultyId, year, month);
            
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String json = mapper.writeValueAsString(attendanceList);
            return ResponseEntity.ok(json);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attendance: " + e.getMessage());
        }
    }

    @GetMapping("/summary/{year}/{month}")
    public ResponseEntity<?> getAttendanceSummary(@PathVariable int year, @PathVariable int month) {
        try {
            List<AttendanceSummaryDTO> summaryList = attendanceService.getAttendanceSummary(year, month);
            
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String json = mapper.writeValueAsString(summaryList);
            return ResponseEntity.ok(json);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attendance summary: " + e.getMessage());
        }
    }

    @GetMapping("/my-attendance/{year}/{month}")
    public ResponseEntity<?> getMyAttendance(@PathVariable int year, @PathVariable int month) {
        try {
            List<AttendanceDTO> attendanceList = attendanceService.getMyAttendance(year, month);
            
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String json = mapper.writeValueAsString(attendanceList);
            return ResponseEntity.ok(json);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attendance: " + e.getMessage());
        }
    }

    @GetMapping("/today")
    public ResponseEntity<?> getTodayAttendance() {
        try {
            List<AttendanceDTO> attendanceList = attendanceService
                    .getAttendanceForCurrentDate(LocalDate.now());
            
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String json = mapper.writeValueAsString(attendanceList);
            return ResponseEntity.ok(json);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attendance: " + e.getMessage());
        }
    }

    @GetMapping("/month/{year}/{month}")
    public ResponseEntity<?> getAttendanceForMonth(@PathVariable int year, @PathVariable int month) {
        try {
            List<AttendanceDTO> attendanceList = attendanceService.getAttendanceForMonth(year, month);
            return ResponseEntity.ok(attendanceList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attendance: " + e.getMessage());
        }
    }
    
    @GetMapping("/hod/month/{year}/{month}")
    public ResponseEntity<?> getAllAttendanceForMonthForHOD(@PathVariable int year, @PathVariable int month) {
        try {
            List<AttendanceDTO> attendanceList = attendanceService.getAllAttendanceForMonthForHOD(year, month);
            return ResponseEntity.ok(attendanceList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attendance: " + e.getMessage());
        }
    }
    
    @GetMapping("/hod/faculty/{facultyId}/month/{year}/{month}")
    public ResponseEntity<?> getAttendanceByFacultyAndMonthForHOD(
            @PathVariable Long facultyId,
            @PathVariable int year,
            @PathVariable int month) {
        try {
            List<AttendanceDTO> attendanceList = attendanceService.getAttendanceByFacultyAndDateRange(facultyId, year, month);
            return ResponseEntity.ok(attendanceList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching attendance: " + e.getMessage());
        }
    }
}


