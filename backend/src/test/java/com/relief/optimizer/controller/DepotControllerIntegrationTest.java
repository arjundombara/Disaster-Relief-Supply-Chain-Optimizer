package com.relief.optimizer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.relief.optimizer.dto.DepotDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@DisplayName("Backend API Integration Tests")
public class DepotControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private DepotDto buildValidDepotDto(String code) {
        DepotDto dto = new DepotDto();
        dto.setCode(code);
        dto.setName("Test Depot " + code);
        dto.setLatitude(28.61);
        dto.setLongitude(77.20);
        dto.setMaxCapacity(1000.0);
        dto.setStatus("ACTIVE");
        return dto;
    }

    // B1: Create depot successfully
    @Test
    @DisplayName("API-B1: Create depot returns 201 with correct data")
    public void testCreateDepotSuccessfully() throws Exception {
        DepotDto dto = buildValidDepotDto("TEST-01");
        mockMvc.perform(post("/api/depots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is("TEST-01")))
                .andExpect(jsonPath("$.name", is("Test Depot TEST-01")))
                .andExpect(jsonPath("$.id", notNullValue()));
    }

    // B2: Reject invalid depot (no name)
    @Test
    @DisplayName("API-B2: Reject depot with missing required fields (400)")
    public void testRejectInvalidDepotData() throws Exception {
        DepotDto dto = new DepotDto(); // missing code, name, lat, lon, capacity
        mockMvc.perform(post("/api/depots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    // B3: Retrieve depot details
    @Test
    @DisplayName("API-B3: Retrieve depot by ID returns correct details")
    public void testRetrieveDepotById() throws Exception {
        DepotDto dto = buildValidDepotDto("RETRIEVE-01");
        MvcResult create = mockMvc.perform(post("/api/depots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();
        long id = objectMapper.readTree(create.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/depots/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("RETRIEVE-01")));
    }

    // B4: Update depot inventory
    @Test
    @DisplayName("API-B4: Update depot inventory quantity")
    public void testUpdateDepotInventory() throws Exception {
        DepotDto dto = buildValidDepotDto("INV-01");
        MvcResult create = mockMvc.perform(post("/api/depots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();
        long id = objectMapper.readTree(create.getResponse().getContentAsString()).get("id").asLong();

        String payload = "{\"supplyType\":\"FOOD\",\"quantity\":250.0}";
        mockMvc.perform(patch("/api/depots/" + id + "/inventory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inventories[?(@.supplyType=='FOOD')].availableQuantity", hasItem(250.0)));
    }

    // B5: Delete a depot
    @Test
    @DisplayName("API-B5: Delete depot returns 204 and subsequent GET returns 404")
    public void testDeleteDepot() throws Exception {
        DepotDto dto = buildValidDepotDto("DEL-01");
        MvcResult create = mockMvc.perform(post("/api/depots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();
        long id = objectMapper.readTree(create.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(delete("/api/depots/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/depots/" + id))
                .andExpect(status().isNotFound());
    }

    // B6: Missing record returns 404
    @Test
    @DisplayName("API-B6: Fetching non-existent depot returns 404")
    public void testGetNonExistentDepot() throws Exception {
        mockMvc.perform(get("/api/depots/999999"))
                .andExpect(status().isNotFound());
    }

    // B7: Reject negative capacity
    @Test
    @DisplayName("API-B7: Reject depot with negative storage capacity")
    public void testRejectNegativeCapacity() throws Exception {
        DepotDto dto = buildValidDepotDto("NEG-01");
        dto.setMaxCapacity(-100.0);
        mockMvc.perform(post("/api/depots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    // B8: Reject invalid route endpoints (invalid depot ID)
    @Test
    @DisplayName("API-B8: Reject route with non-existent source depot ID")
    public void testRejectInvalidRouteEndpoints() throws Exception {
        String routeJson = "{\"routeCode\":\"BAD-R01\",\"sourceDepotId\":9999,\"destinationPointId\":9999,\"capacity\":50.0}";
        mockMvc.perform(post("/api/routes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(routeJson))
                .andExpect(status().isNotFound());
    }

    // B9: Update shipment status
    @Test
    @DisplayName("API-B9: Load demo data and verify dashboard stats returned")
    public void testDashboardStatsReturnCorrectly() throws Exception {
        mockMvc.perform(delete("/api/dashboard/demo/reset")).andExpect(status().isOk());
        mockMvc.perform(post("/api/dashboard/demo/load")).andExpect(status().isOk());

        mockMvc.perform(get("/api/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDepots", greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.totalDistributionPoints", greaterThanOrEqualTo(4)));
    }

    // B10: Invalid status transition
    @Test
    @DisplayName("API-B10: Run demo, optimize, and verify shipments created")
    public void testRunAllocationCreatesShipments() throws Exception {
        // Load demo data
        mockMvc.perform(delete("/api/dashboard/demo/reset")).andExpect(status().isOk());
        mockMvc.perform(post("/api/dashboard/demo/load")).andExpect(status().isOk());

        // Run allocation for FOOD
        String payload = "{\"supplyType\":\"FOOD\",\"algorithm\":\"EDMONDS_KARP\",\"allocationPolicy\":\"MAX_FLOW\"}";
        MvcResult result = mockMvc.perform(post("/api/allocations/run")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.supplyType", is("FOOD")))
                .andExpect(jsonPath("$.totalAllocatedFlow", greaterThan(0.0)))
                .andReturn();

        // Verify shipments list is non-empty
        mockMvc.perform(get("/api/allocations/shipments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())));
    }

    // B11: Reject invalid status transition on shipment
    @Test
    @DisplayName("API-B11: Reject invalid status transition (DELIVERED -> PENDING)")
    public void testRejectInvalidStatusTransition() throws Exception {
        // Load demo data and create shipment
        mockMvc.perform(delete("/api/dashboard/demo/reset")).andExpect(status().isOk());
        mockMvc.perform(post("/api/dashboard/demo/load")).andExpect(status().isOk());
        String payload = "{\"supplyType\":\"FOOD\",\"algorithm\":\"EDMONDS_KARP\",\"allocationPolicy\":\"MAX_FLOW\"}";
        mockMvc.perform(post("/api/allocations/run")
                .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated());

        // Get first shipment
        MvcResult shipmentsResult = mockMvc.perform(get("/api/allocations/shipments"))
                .andExpect(status().isOk()).andReturn();
        long shipmentId = objectMapper.readTree(shipmentsResult.getResponse().getContentAsString())
                .get(0).get("id").asLong();

        // Move to DISPATCHED then DELIVERED
        mockMvc.perform(patch("/api/allocations/shipments/" + shipmentId + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"DISPATCHED\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/allocations/shipments/" + shipmentId + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isOk());

        // Attempt invalid transition DELIVERED -> PENDING
        mockMvc.perform(patch("/api/allocations/shipments/" + shipmentId + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"PENDING\"}"))
                .andExpect(status().isBadRequest());
    }
}
