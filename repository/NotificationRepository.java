package com.studenttrack.repository;

import com.studenttrack.entity.Notification;
import com.studenttrack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    
    List<Notification> findByUserAndIsReadOrderByCreatedAtDesc(User user, Boolean isRead);
    
    Long countByUserAndIsRead(User user, Boolean isRead);
    
    List<Notification> findTop10ByUserOrderByCreatedAtDesc(User user);
}
