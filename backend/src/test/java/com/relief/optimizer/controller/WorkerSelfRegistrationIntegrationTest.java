package com.relief.optimizer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.relief.optimizer.dto.LoginRequestDto;
import com.relief.optimizer.dto.WorkerRegisterRequestDto;
import com.relief.optimizer.model.Role;
import com.relief.optimizer.model.User;
import com.relief.optimizer.model.WorkerApprovalStatus;
import com.relief.optimizer.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Worker Self-Registration and Admin Approval System Tests")
public class WorkerSelfRegistrationIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;

    private static Long worker1Id;
    private static Long worker2Id;
    private static String worker1Username = "reg_worker_test1";
    private static String worker2Username = "reg_worker_test2";

    @Test
    @Order(1)
    @DisplayName("Scenario 1: New worker registers → Status is PENDING and role is WORKER")
    public void testScenario1_WorkerSelfRegistration() throws Exception {
        WorkerRegisterRequestDto request = new WorkerRegisterRequestDto(
                "Rohan Deshmukh",
                worker1Username,
                "rohan.deshmukh@relief.org",
                "Secret@2026!",
                "Secret@2026!"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message", containsString("Registration successful! Your account is waiting for Admin approval.")))
                .andExpect(jsonPath("$.username", is(worker1Username)))
                .andExpect(jsonPath("$.role", is("WORKER")))
                .andExpect(jsonPath("$.approvalStatus", is("PENDING")))
                .andReturn();

        worker1Id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        User user = userRepository.findByUsername(worker1Username).orElse(null);
        assertNotNull(user);
        assertEquals(Role.WORKER, user.getRole());
        assertEquals(WorkerApprovalStatus.PENDING, user.getApprovalStatus());
    }

    @Test
    @Order(2)
    @DisplayName("Scenario 2: Pending worker attempts login → Access denied with awaiting approval message")
    public void testScenario2_PendingWorkerLoginFails() throws Exception {
        LoginRequestDto login = new LoginRequestDto(worker1Username, "Secret@2026!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("Your account is awaiting Admin approval.")));
    }

    @Test
    @Order(3)
    @DisplayName("Scenario 3: Admin approves worker → Status changes to APPROVED")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testScenario3_AdminApprovesWorker() throws Exception {
        assertNotNull(worker1Id);

        mockMvc.perform(post("/api/users/" + worker1Id + "/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(worker1Id.intValue())))
                .andExpect(jsonPath("$.approvalStatus", is("APPROVED")));

        User user = userRepository.findById(worker1Id).orElse(null);
        assertNotNull(user);
        assertEquals(WorkerApprovalStatus.APPROVED, user.getApprovalStatus());
    }

    @Test
    @Order(4)
    @DisplayName("Scenario 4: Approved worker logs in → Worker Dashboard access granted (JWT issued)")
    public void testScenario4_ApprovedWorkerLoginSuccess() throws Exception {
        LoginRequestDto login = new LoginRequestDto(worker1Username, "Secret@2026!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.username", is(worker1Username)))
                .andExpect(jsonPath("$.role", is("WORKER")));
    }

    @Test
    @Order(5)
    @DisplayName("Scenario 5: Admin rejects another worker → Status changes to REJECTED")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testScenario5_AdminRejectsWorker() throws Exception {
        // First register worker2
        WorkerRegisterRequestDto request = new WorkerRegisterRequestDto(
                "Karan Mehra",
                worker2Username,
                "karan.mehra@relief.org",
                "Secret@2026!",
                "Secret@2026!"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.approvalStatus", is("PENDING")))
                .andReturn();

        worker2Id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        // Admin rejects worker2
        mockMvc.perform(post("/api/users/" + worker2Id + "/reject"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(worker2Id.intValue())))
                .andExpect(jsonPath("$.approvalStatus", is("REJECTED")));

        User user = userRepository.findById(worker2Id).orElse(null);
        assertNotNull(user);
        assertEquals(WorkerApprovalStatus.REJECTED, user.getApprovalStatus());
    }

    @Test
    @Order(6)
    @DisplayName("Scenario 6: Rejected worker attempts login → Access denied with rejection message")
    public void testScenario6_RejectedWorkerLoginFails() throws Exception {
        LoginRequestDto login = new LoginRequestDto(worker2Username, "Secret@2026!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("Your registration request was rejected. Contact the Admin.")));
    }

    @Test
    @Order(7)
    @DisplayName("Scenario 7: Worker attempts to access Admin APIs → 403 Forbidden")
    public void testScenario7_WorkerCannotAccessAdminApis() throws Exception {
        // Authenticate as approved worker to get real JWT
        LoginRequestDto login = new LoginRequestDto(worker1Username, "Secret@2026!");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String workerJwt = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();

        // Worker attempts to access Admin-only worker list
        mockMvc.perform(get("/api/users/workers")
                .header("Authorization", "Bearer " + workerJwt))
                .andExpect(status().isForbidden());

        // Worker attempts to access Admin-only flow optimization run
        mockMvc.perform(post("/api/allocations/run")
                .header("Authorization", "Bearer " + workerJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"supplyType\":\"FOOD\",\"policy\":\"MAX_FLOW\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(8)
    @DisplayName("Scenario 8: Worker attempts to approve another account → 403 Forbidden")
    public void testScenario8_WorkerCannotApproveAccounts() throws Exception {
        // Authenticate as approved worker to get real JWT
        LoginRequestDto login = new LoginRequestDto(worker1Username, "Secret@2026!");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String workerJwt = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();

        // Worker attempts to call approval endpoint on worker2
        mockMvc.perform(post("/api/users/" + worker2Id + "/approve")
                .header("Authorization", "Bearer " + workerJwt))
                .andExpect(status().isForbidden());

        // Worker attempts to call rejection endpoint on worker2
        mockMvc.perform(post("/api/users/" + worker2Id + "/reject")
                .header("Authorization", "Bearer " + workerJwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(9)
    @DisplayName("Scenario 9: Existing Admin logs in → Works normally")
    public void testScenario9_ExistingAdminLogsInNormally() throws Exception {
        LoginRequestDto login = new LoginRequestDto("admin", "Admin@Relief2026!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.username", is("admin")))
                .andExpect(jsonPath("$.role", is("ADMIN")));
    }

    @Test
    @Order(10)
    @DisplayName("Scenario 10: Existing approved Worker logs in → Works normally")
    public void testScenario10_ExistingApprovedWorkerLogsInNormally() throws Exception {
        LoginRequestDto login = new LoginRequestDto("worker1", "Worker@Relief2026!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.username", is("worker1")))
                .andExpect(jsonPath("$.role", is("WORKER")));
    }

    @Test
    @Order(11)
    @DisplayName("Validation: Registration with password mismatch is rejected")
    public void testRegistration_PasswordMismatch() throws Exception {
        WorkerRegisterRequestDto request = new WorkerRegisterRequestDto(
                "Mismatch User",
                "mismatch_user_" + System.currentTimeMillis(),
                "mismatch_" + System.currentTimeMillis() + "@relief.org",
                "Secret@2026!",
                "DifferentPassword!"
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Password and confirm password do not match")));
    }

    @Test
    @Order(12)
    @DisplayName("Validation: Registration with duplicate username is rejected")
    public void testRegistration_DuplicateUsername() throws Exception {
        WorkerRegisterRequestDto request = new WorkerRegisterRequestDto(
                "Duplicate Username User",
                worker1Username, // already registered in testScenario1
                "unique_email_" + System.currentTimeMillis() + "@relief.org",
                "Secret@2026!",
                "Secret@2026!"
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Username is already taken")));
    }

    @Test
    @Order(13)
    @DisplayName("Validation: Registration with duplicate email is rejected")
    public void testRegistration_DuplicateEmail() throws Exception {
        WorkerRegisterRequestDto request = new WorkerRegisterRequestDto(
                "Duplicate Email User",
                "unique_user_" + System.currentTimeMillis(),
                "rohan.deshmukh@relief.org", // already registered in testScenario1
                "Secret@2026!",
                "Secret@2026!"
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Email is already registered")));
    }
}

