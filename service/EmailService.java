package com.studenttrack.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.email.from:noreply@studenttrack.com}")
    private String fromEmail;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @Async
    public void sendEmail(String to, String subject, String body) {
        if (!emailEnabled) {
            logger.info("Email disabled. Would have sent to: {} with subject: {}", to, subject);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email to: {}", to, e);
        }
    }

    @Async
    public void sendBulkEmail(List<String> recipients, String subject, String body) {
        if (!emailEnabled) {
            logger.info("Email disabled. Would have sent to {} recipients", recipients.size());
            return;
        }

        for (String recipient : recipients) {
            sendEmail(recipient, subject, body);
        }
    }

    @Async
    public void sendTaskNotification(List<String> studentEmails, String taskTitle, String subject, 
                                     String facultyName, String dueDate) {
        String emailSubject = "New Task Assigned: " + taskTitle;
        String emailBody = String.format(
            "Dear Student,\n\n" +
            "A new task has been assigned to you by %s.\n\n" +
            "Task Title: %s\n" +
            "Subject: %s\n" +
            "Due Date: %s\n\n" +
            "Please login to the Student Track System to view details and submit your work.\n\n" +
            "Best regards,\n" +
            "Student Track System",
            facultyName, taskTitle, subject, dueDate
        );
        
        sendBulkEmail(studentEmails, emailSubject, emailBody);
    }

    @Async
    public void sendQuizNotification(List<String> studentEmails, String quizTitle, String subject,
                                     String facultyName, String startTime, String endTime, boolean isGoogleForm) {
        String emailSubject = "New Quiz Available: " + quizTitle;
        String quizType = isGoogleForm ? "Google Form Quiz" : "System Quiz";
        String emailBody = String.format(
            "Dear Student,\n\n" +
            "A new quiz has been created by %s.\n\n" +
            "Quiz Title: %s\n" +
            "Subject: %s\n" +
            "Type: %s\n" +
            "Start Time: %s\n" +
            "End Time: %s\n\n" +
            "Please login to the Student Track System to attempt the quiz during the specified time.\n\n" +
            "Best regards,\n" +
            "Student Track System",
            facultyName, quizTitle, subject, quizType, startTime, endTime
        );
        
        sendBulkEmail(studentEmails, emailSubject, emailBody);
    }

    @Async
    public void sendNoteNotification(List<String> studentEmails, String noteTitle, String subject,
                                     String facultyName, boolean hasAttachment) {
        String emailSubject = "New Note Posted: " + noteTitle;
        String attachmentInfo = hasAttachment ? "This note includes file attachments." : "";
        String emailBody = String.format(
            "Dear Student,\n\n" +
            "A new note has been posted by %s.\n\n" +
            "Note Title: %s\n" +
            "%s\n\n" +
            "Please login to the Student Track System to view the note.\n\n" +
            "Best regards,\n" +
            "Student Track System",
            facultyName, noteTitle, attachmentInfo
        );
        
        sendBulkEmail(studentEmails, emailSubject, emailBody);
    }

    @Async
    public void sendMarksNotification(String studentEmail, String studentName, String subject,
                                      String assessmentType, int marksObtained, int maxMarks) {
        String emailSubject = "Marks Updated: " + subject + " - " + assessmentType;
        double percentage = (double) marksObtained / maxMarks * 100;
        String emailBody = String.format(
            "Dear %s,\n\n" +
            "Your marks have been updated for:\n\n" +
            "Subject: %s\n" +
            "Assessment: %s\n" +
            "Marks Obtained: %d / %d\n" +
            "Percentage: %.2f%%\n\n" +
            "Please login to the Student Track System to view detailed marks.\n\n" +
            "Best regards,\n" +
            "Student Track System",
            studentName, subject, assessmentType, marksObtained, maxMarks, percentage
        );
        
        sendEmail(studentEmail, emailSubject, emailBody);
    }

    @Async
    public void sendSubmissionFeedback(String studentEmail, String studentName, String taskTitle,
                                       String facultyRemark) {
        String emailSubject = "Submission Reviewed: " + taskTitle;
        String emailBody = String.format(
            "Dear %s,\n\n" +
            "Your submission for '%s' has been reviewed.\n\n" +
            "Faculty Remark: %s\n\n" +
            "Please login to the Student Track System to view complete feedback.\n\n" +
            "Best regards,\n" +
            "Student Track System",
            studentName, taskTitle, facultyRemark
        );
        
        sendEmail(studentEmail, emailSubject, emailBody);
    }

    @Async
    public void sendQuizResultNotification(String studentEmail, String quizTitle, int totalMarks) {
        if (studentEmail == null || studentEmail.isEmpty()) {
            logger.warn("Skipping quiz result email due to missing student email");
            return;
        }
        String emailSubject = "Quiz Result: " + quizTitle;
        String emailBody = String.format(
            "Dear Student,\n\n" +
            "Your quiz '%s' has been evaluated.\n\n" +
            "Total Marks: %d\n\n" +
            "Please login to the Student Track System to view detailed results.\n\n" +
            "Best regards,\n" +
            "Student Track System",
            quizTitle, totalMarks
        );
        sendEmail(studentEmail, emailSubject, emailBody);
    }

    @Async
    public void sendSubmissionReceivedEmail(String facultyEmail, String facultyName, 
                                           String studentName, String taskTitle) {
        String emailSubject = "New Submission Received: " + taskTitle;
        String emailBody = String.format(
            "Dear %s,\n\n" +
            "Student %s has submitted their work for the task '%s'.\n\n" +
            "Please login to the Student Track System to review the submission.\n\n" +
            "Best regards,\n" +
            "Student Track System",
            facultyName, studentName, taskTitle
        );
        sendEmail(facultyEmail, emailSubject, emailBody);
    }

    @Async
    public void sendAttendanceAlertEmail(String studentEmail, String studentName, 
                                        String date, String subject, String status) {
        String emailSubject = "Attendance Marked: " + subject;
        String emailBody = String.format(
            "Dear %s,\n\n" +
            "Your attendance has been marked for:\n\n" +
            "Date: %s\nSubject: %s\nStatus: %s\n\n" +
            "Best regards,\n" +
            "Student Track System",
            studentName, date, subject, status
        );
        sendEmail(studentEmail, emailSubject, emailBody);
    }

    @Async
    public void sendResourceAddedEmail(List<String> studentEmails, String resourceTitle, 
                                      String subject, String uploadedBy) {
        String emailSubject = "New Resource Added: " + subject;
        String emailBody = String.format(
            "Dear Student,\n\n" +
            "A new resource has been added for %s:\n\n" +
            "Resource: %s\nUploaded By: %s\n\n" +
            "Please login to the Student Track System to access it.\n\n" +
            "Best regards,\n" +
            "Student Track System",
            subject, resourceTitle, uploadedBy
        );
        sendBulkEmail(studentEmails, emailSubject, emailBody);
    }

    @Async
    public void sendLiveClassScheduledEmail(List<String> studentEmails, String classTitle, 
                                           String scheduledTime, String meetingUrl, String facultyName) {
        String emailSubject = "Live Class Scheduled: " + classTitle;
        String emailBody = String.format(
            "Dear Student,\n\n" +
            "A live class has been scheduled by %s:\n\n" +
            "Title: %s\nScheduled: %s\nMeeting Link: %s\n\n" +
            "Please join on time.\n\n" +
            "Best regards,\n" +
            "Student Track System",
            facultyName, classTitle, scheduledTime, meetingUrl
        );
        sendBulkEmail(studentEmails, emailSubject, emailBody);
    }

    @Async
    public void sendDeadlineReminderEmail(String studentEmail, String studentName, 
                                         String taskTitle, String dueDate) {
        String emailSubject = "Deadline Reminder: " + taskTitle;
        String emailBody = String.format(
            "Dear %s,\n\n" +
            "This is a reminder that the following task is due soon:\n\n" +
            "Task: %s\nDue Date: %s\n\n" +
            "Please ensure you submit your work on time.\n\n" +
            "Best regards,\n" +
            "Student Track System",
            studentName, taskTitle, dueDate
        );
        sendEmail(studentEmail, emailSubject, emailBody);
    }
}