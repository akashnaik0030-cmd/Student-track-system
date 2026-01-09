package com.studenttrack.service;

import com.studenttrack.entity.Notification;
import com.studenttrack.entity.User;
import com.studenttrack.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private EmailService emailService;

    @Transactional
    public Notification createNotification(User user, String title, String message, 
                                          Notification.NotificationType type, Long referenceId) {
        Notification notification = new Notification(user, title, message, type, referenceId);
        notification = notificationRepository.save(notification);
        
        // Send real-time notification via WebSocket
        sendRealtimeNotification(user.getId(), notification);
        
        // Send email notification (fallback to generic email if available)
        try {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                emailService.sendEmail(user.getEmail(), title, message);
            }
        } catch (Exception ignored) {}
        
        return notification;
    }

    @Transactional
    public void createNotificationForMultipleUsers(List<User> users, String title, String message,
                                                   Notification.NotificationType type, Long referenceId) {
        for (User user : users) {
            createNotification(user, title, message, type, referenceId);
        }
    }

    private void sendRealtimeNotification(Long userId, Notification notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                notification
            );
        } catch (Exception e) {
            // Log error but don't fail the transaction
            System.err.println("Failed to send real-time notification: " + e.getMessage());
        }
    }

    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Notification> getUnreadNotifications(User user) {
        return notificationRepository.findByUserAndIsReadOrderByCreatedAtDesc(user, false);
    }

    public Long getUnreadCount(User user) {
        return notificationRepository.countByUserAndIsRead(user, false);
    }

    public List<Notification> getRecentNotifications(User user) {
        return notificationRepository.findTop10ByUserOrderByCreatedAtDesc(user);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unreadNotifications = getUnreadNotifications(user);
        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    @Transactional
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
}
