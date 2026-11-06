package com.relief.optimizer.config;

import com.relief.optimizer.model.Role;
import com.relief.optimizer.model.User;
import com.relief.optimizer.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Initializes default accounts only when the target database has no accounts
 * (e.g., fresh in-memory database during integration testing).
 * Existing accounts, usernames, and passwords in persistent storage are preserved.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Preserves existing database: only executes if no admin account exists
        if (!userRepository.existsByRole(Role.ADMIN)) {
            logger.info("No Admin account found in database. Initializing bootstrap admin account...");
            User admin = new User(
                    null,
                    "admin",
                    "admin@relief.org",
                    passwordEncoder.encode("Admin@Relief2026!"),
                    "Central Relief Administrator",
                    Role.ADMIN,
                    true,
                    null,
                    null,
                    "+91-11-23000001"
            );
            userRepository.save(admin);
            logger.info("Bootstrap admin account initialized: username=admin");
        }

        // Preserves existing database: only executes if no worker accounts exist
        if (userRepository.findByRole(Role.WORKER).isEmpty()) {
            logger.info("No Field Worker accounts found in database. Initializing bootstrap workers...");
            User worker1 = new User(
                    null,
                    "worker1",
                    "worker1@relief.org",
                    passwordEncoder.encode("Worker@Relief2026!"),
                    "Ramesh Kumar (Field Unit 1)",
                    Role.WORKER,
                    true,
                    1L,
                    1L,
                    "+91-9811000001"
            );
            User worker2 = new User(
                    null,
                    "worker2",
                    "worker2@relief.org",
                    passwordEncoder.encode("Worker@Relief2026!"),
                    "Sunita Sharma (Field Unit 2)",
                    Role.WORKER,
                    true,
                    2L,
                    2L,
                    "+91-9811000002"
            );
            userRepository.save(worker1);
            userRepository.save(worker2);
            logger.info("Bootstrap worker accounts initialized: worker1, worker2");
        }
    }
}
