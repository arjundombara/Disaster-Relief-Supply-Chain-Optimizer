package com.relief.optimizer.service;

import com.relief.optimizer.exception.ResourceNotFoundException;
import com.relief.optimizer.model.Notification;
import com.relief.optimizer.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification create(String recipient, String message, String type, String refCode, Long refId) {
        Notification notification = new Notification(null, recipient, message, type, refCode, refId);
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotificationsForUser(String username) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(username);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String username) {
        return notificationRepository.countByRecipientAndIsReadFalse(username);
    }

    public Notification markAsRead(Long id, String username) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        if (notification.getRecipient().equalsIgnoreCase(username)) {
            notification.setIsRead(true);
            return notificationRepository.save(notification);
        }
        return notification;
    }

    public void markAllAsRead(String username) {
        List<Notification> unread = notificationRepository.findByRecipientAndIsReadFalseOrderByCreatedAtDesc(username);
        for (Notification n : unread) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(unread);
    }
}
