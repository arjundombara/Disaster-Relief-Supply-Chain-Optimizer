package com.relief.optimizer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.relief.optimizer.dto.CreateWorkerRequestDto;
import com.relief.optimizer.dto.LoginRequestDto;
import com.relief.optimizer.model.Disaster;
import com.relief.optimizer.model.SeverityLevel;
import com.relief.optimizer.repository.DisasterRepository;
import com.relief.optimizer.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@DisplayName("Authentication and RBAC Security Tests")
public class AuthControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private DisasterRepository disasterRepository;

    @Test
    @DisplayName("AUTH-01: Admin can authenticate with valid credentials and receives JWT")
    public void testAdminLoginSuccess() throws Exception {
        LoginRequestDto request = new LoginRequestDto("admin", "Admin@Relief2026!");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.username", is("admin")))
                .andExpect(jsonPath("$.role", is("ADMIN")));
    }

    @Test
    @DisplayName("AUTH-02: Login fails with invalid password (401 Unauthorized)")
    public void testLoginWithInvalidPassword() throws Exception {
        LoginRequestDto request = new LoginRequestDto("admin", "WrongPassword123!");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AUTH-03: Field Worker can authenticate with seeded credentials")
    public void testWorkerLoginSuccess() throws Exception {
        LoginRequestDto request = new LoginRequestDto("worker1", "Worker@Relief2026!");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.username", is("worker1")))
                .andExpect(jsonPath("$.role", is("WORKER")));
    }

    @Test
    @DisplayName("AUTH-04: Admin can register a new field worker account")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testRegisterNewWorker() throws Exception {
        String uniqueUser = "worker_test_" + System.currentTimeMillis();
        CreateWorkerRequestDto request = new CreateWorkerRequestDto();
        request.setUsername(uniqueUser);
        request.setEmail(uniqueUser + "@relief.org");
        request.setFullName("Test Worker");
        request.setPassword("Secret123!");
        request.setPhone("+91-9999900000");

        mockMvc.perform(post("/api/auth/register-worker")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username", is(uniqueUser)))
                .andExpect(jsonPath("$.role", is("WORKER")));
    }

    @Test
    @DisplayName("AUTH-04B: Unauthenticated user cannot register worker (Unauthorized)")
    public void testUnauthenticatedCannotRegisterWorker() throws Exception {
        CreateWorkerRequestDto request = new CreateWorkerRequestDto();
        request.setUsername("anon_worker_" + System.currentTimeMillis());
        request.setEmail("anon@relief.org");
        request.setFullName("Anonymous Worker");
        request.setPassword("Secret123!");

        mockMvc.perform(post("/api/auth/register-worker")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AUTH-04C: Field Worker cannot register another worker (Forbidden)")
    @WithMockUser(username = "worker1", roles = {"WORKER"})
    public void testWorkerCannotRegisterWorker() throws Exception {
        CreateWorkerRequestDto request = new CreateWorkerRequestDto();
        request.setUsername("sub_worker_" + System.currentTimeMillis());
        request.setEmail("sub@relief.org");
        request.setFullName("Sub Worker");
        request.setPassword("Secret123!");

        mockMvc.perform(post("/api/auth/register-worker")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("AUTH-04D: Admin can create worker via /api/users/workers")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testAdminCreateWorkerViaUsersEndpoint() throws Exception {
        String uniqueUser = "admin_created_worker_" + System.currentTimeMillis();
        CreateWorkerRequestDto request = new CreateWorkerRequestDto();
        request.setUsername(uniqueUser);
        request.setEmail(uniqueUser + "@relief.org");
        request.setFullName("Admin Created Worker");
        request.setPassword("Secret123!");

        mockMvc.perform(post("/api/users/workers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username", is(uniqueUser)))
                .andExpect(jsonPath("$.role", is("WORKER")));
    }

    @Test
    @DisplayName("AUTH-04E: Unauthenticated user cannot create worker via /api/users/workers")
    public void testUnauthenticatedCannotCreateWorkerViaUsersEndpoint() throws Exception {
        CreateWorkerRequestDto request = new CreateWorkerRequestDto();
        request.setUsername("anon_users_" + System.currentTimeMillis());
        request.setEmail("anon_users@relief.org");
        request.setFullName("Anon User");
        request.setPassword("Secret123!");

        mockMvc.perform(post("/api/users/workers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AUTH-05: Authenticated user can fetch own profile via /me")
    public void testGetMeWithBearerToken() throws Exception {
        // First log in to obtain JWT
        LoginRequestDto login = new LoginRequestDto("admin", "Admin@Relief2026!");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String jwt = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();

        // Use Bearer token
        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is("admin")))
                .andExpect(jsonPath("$.role", is("ADMIN")));
    }

    @Test
    @DisplayName("DISASTER-01: Disasters can be listed and retrieved")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testDisastersManagement() throws Exception {
        Disaster disaster = new Disaster();
        disaster.setName("Cyclone Test 2026");
        disaster.setDisasterType("CYCLONE");
        disaster.setAffectedLocation("Coastal Region Sector 4");
        disaster.setSeverity(SeverityLevel.CRITICAL);
        disaster.setStatus("ACTIVE");
        disaster.setEstimatedPopulation(25000);
        disaster.setReportedAt(LocalDateTime.now());
        disaster = disasterRepository.save(disaster);

        mockMvc.perform(get("/api/disasters/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[*].name", hasItem("Cyclone Test 2026")));
    }
}
