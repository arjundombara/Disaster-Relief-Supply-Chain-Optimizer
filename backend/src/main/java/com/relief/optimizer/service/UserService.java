package com.relief.optimizer.service;

import com.relief.optimizer.dto.*;
import com.relief.optimizer.exception.AccountPendingException;
import com.relief.optimizer.exception.AccountRejectedException;
import com.relief.optimizer.exception.ResourceNotFoundException;
import com.relief.optimizer.exception.ValidationException;
import com.relief.optimizer.model.Role;
import com.relief.optimizer.model.User;
import com.relief.optimizer.model.WorkerApprovalStatus;
import com.relief.optimizer.repository.UserRepository;
import com.relief.optimizer.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Autowired
    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
    }

    public LoginResponseDto login(LoginRequestDto loginRequest) {
        String identifier = loginRequest.getUsername().trim();

        User user = userRepository.findByUsernameOrEmail(identifier, identifier)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new ValidationException("This account has been disabled. Please contact an administrator.");
        }

        if (user.getRole() == Role.WORKER) {
            if (user.getApprovalStatus() == WorkerApprovalStatus.PENDING) {
                throw new AccountPendingException("Your account is awaiting Admin approval.");
            }
            if (user.getApprovalStatus() == WorkerApprovalStatus.REJECTED) {
                throw new AccountRejectedException("Your registration request was rejected. Contact the Admin.");
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), loginRequest.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String token = jwtUtils.generateToken(user.getId(), user.getUsername(), user.getRole().name());

        return new LoginResponseDto(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getAssignedDepotId(),
                user.getAssignedLocationId()
        );
    }

    public UserDto setupInitialAdmin(SetupAdminRequestDto request) {
        if (userRepository.existsByRole(Role.ADMIN)) {
            throw new ValidationException("An administrator account already exists. Setup is locked.");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ValidationException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email is already registered");
        }

        User admin = new User(
                null,
                request.getUsername().trim().toLowerCase(),
                request.getEmail().trim().toLowerCase(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                Role.ADMIN,
                true,
                null,
                null,
                null
        );

        return UserDto.fromEntity(userRepository.save(admin));
    }

    public UserDto createWorker(CreateWorkerRequestDto request) {
        String username = request.getUsername().trim().toLowerCase();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new ValidationException("Username is already taken: " + username);
        }
        if (userRepository.existsByEmail(email)) {
            throw new ValidationException("Email is already registered: " + email);
        }

        User worker = new User(
                null,
                username,
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                Role.WORKER, // Enforce WORKER role - cannot create Admin via this API
                true,
                request.getAssignedDepotId(),
                request.getAssignedLocationId(),
                request.getPhone()
        );

        return UserDto.fromEntity(userRepository.save(worker));
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return UserDto.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllWorkers() {
        return userRepository.findByRole(Role.WORKER).stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserDto.fromEntity(user);
    }

    public UserDto toggleUserActiveStatus(Long id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Prevent disabling the last admin
        if (!active && user.getRole() == Role.ADMIN) {
            long activeAdminCount = userRepository.findByRoleAndActiveTrue(Role.ADMIN).size();
            if (activeAdminCount <= 1) {
                throw new ValidationException("Cannot disable the sole active administrator account.");
            }
        }

        user.setActive(active);
        return UserDto.fromEntity(userRepository.save(user));
    }

    public UserDto updateWorkerAssignment(Long workerId, Long depotId, Long locationId) {
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found with id: " + workerId));

        if (worker.getRole() != Role.WORKER) {
            throw new ValidationException("User is not a worker: " + worker.getUsername());
        }

        worker.setAssignedDepotId(depotId);
        worker.setAssignedLocationId(locationId);
        return UserDto.fromEntity(userRepository.save(worker));
    }

    public UserDto selfRegisterWorker(WorkerRegisterRequestDto request) {
        if (request.getPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            throw new ValidationException("Password and confirm password do not match");
        }

        String username = request.getUsername().trim().toLowerCase();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new ValidationException("Username is already taken: " + username);
        }
        if (userRepository.existsByEmail(email)) {
            throw new ValidationException("Email is already registered: " + email);
        }

        User worker = new User();
        worker.setUsername(username);
        worker.setEmail(email);
        worker.setPassword(passwordEncoder.encode(request.getPassword()));
        worker.setFullName(request.getFullName().trim());
        worker.setRole(Role.WORKER);
        worker.setActive(true);
        worker.setApprovalStatus(WorkerApprovalStatus.PENDING);
        worker.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        worker.setCreatedAt(java.time.LocalDateTime.now());

        return UserDto.fromEntity(userRepository.save(worker));
    }

    public UserDto approveWorker(Long id) {
        User worker = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found with id: " + id));

        if (worker.getRole() != Role.WORKER) {
            throw new ValidationException("Only worker accounts require approval.");
        }

        worker.setApprovalStatus(WorkerApprovalStatus.APPROVED);
        return UserDto.fromEntity(userRepository.save(worker));
    }

    public UserDto rejectWorker(Long id) {
        User worker = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found with id: " + id));

        if (worker.getRole() != Role.WORKER) {
            throw new ValidationException("Only worker accounts can be rejected.");
        }

        worker.setApprovalStatus(WorkerApprovalStatus.REJECTED);
        return UserDto.fromEntity(userRepository.save(worker));
    }

    public UserDto updateWorkerApprovalStatus(Long id, WorkerApprovalStatus status) {
        User worker = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found with id: " + id));

        if (worker.getRole() != Role.WORKER) {
            throw new ValidationException("Only worker accounts have an approval status.");
        }

        worker.setApprovalStatus(status != null ? status : WorkerApprovalStatus.PENDING);
        return UserDto.fromEntity(userRepository.save(worker));
    }
}
