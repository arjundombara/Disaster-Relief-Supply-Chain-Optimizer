package com.relief.optimizer.repository;

import com.relief.optimizer.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientOrderByCreatedAtDesc(String recipient);
    List<Notification> findByRecipientAndIsReadFalseOrderByCreatedAtDesc(String recipient);
    long countByRecipientAndIsReadFalse(String recipient);
}
