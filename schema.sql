-- =====================================================================
-- Disaster Relief Supply Chain Optimizer (Problem Statement No. 111)
-- Database Schema for MySQL / MariaDB / H2 Relational Database
-- =====================================================================

CREATE DATABASE IF NOT EXISTS disaster_relief_db;
USE disaster_relief_db;

-- 1. Central Relief Depots
CREATE TABLE IF NOT EXISTS depots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    address VARCHAR(255),
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    max_capacity DOUBLE NOT NULL DEFAULT 5000.0,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Depot Inventories (Per-Supply Stock)
CREATE TABLE IF NOT EXISTS inventories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    depot_id BIGINT NOT NULL,
    supply_type VARCHAR(50) NOT NULL, -- FOOD, WATER, MEDICINE, SHELTER
    available_quantity DOUBLE NOT NULL DEFAULT 0.0,
    reserved_quantity DOUBLE NOT NULL DEFAULT 0.0,
    minimum_threshold DOUBLE NOT NULL DEFAULT 10.0,
    unit VARCHAR(50) NOT NULL,
    CONSTRAINT uk_depot_supply UNIQUE (depot_id, supply_type),
    CONSTRAINT fk_inventory_depot FOREIGN KEY (depot_id) REFERENCES depots(id) ON DELETE CASCADE
);

-- 3. Disaster-Affected Locations (Distribution Points)
CREATE TABLE IF NOT EXISTS distribution_points (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    address VARCHAR(255),
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    severity VARCHAR(50) NOT NULL DEFAULT 'HIGH', -- CRITICAL, HIGH, MODERATE, LOW
    priority_score INT NOT NULL DEFAULT 3, -- 1 to 5
    affected_population INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    food_demand DOUBLE NOT NULL DEFAULT 0.0,
    water_demand DOUBLE NOT NULL DEFAULT 0.0,
    medicine_demand DOUBLE NOT NULL DEFAULT 0.0,
    shelter_demand DOUBLE NOT NULL DEFAULT 0.0,
    food_delivered DOUBLE NOT NULL DEFAULT 0.0,
    water_delivered DOUBLE NOT NULL DEFAULT 0.0,
    medicine_delivered DOUBLE NOT NULL DEFAULT 0.0,
    shelter_delivered DOUBLE NOT NULL DEFAULT 0.0,
    total_delivered DOUBLE NOT NULL DEFAULT 0.0,
    total_requested_demand DOUBLE NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Transportation Route Corridors
CREATE TABLE IF NOT EXISTS routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_code VARCHAR(50) NOT NULL UNIQUE,
    source_depot_id BIGINT NOT NULL,
    destination_point_id BIGINT NOT NULL,
    capacity DOUBLE NOT NULL, -- Max units passable
    distance_km DOUBLE,
    travel_time_hours DOUBLE,
    road_condition VARCHAR(100) DEFAULT 'CLEAR', -- CLEAR, FLOOD_RISK, DAMAGED, BLOCKED
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_route_source FOREIGN KEY (source_depot_id) REFERENCES depots(id) ON DELETE RESTRICT,
    CONSTRAINT fk_route_dest FOREIGN KEY (destination_point_id) REFERENCES distribution_points(id) ON DELETE RESTRICT
);

-- 5. Optimization Allocation Runs
CREATE TABLE IF NOT EXISTS allocations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    allocation_policy VARCHAR(100) NOT NULL, -- MAX_FLOW, PRIORITY_WEIGHTED, PROPORTIONAL
    supply_type VARCHAR(50) NOT NULL,
    total_available_supply DOUBLE NOT NULL,
    total_requested_demand DOUBLE NOT NULL,
    total_allocated_flow DOUBLE NOT NULL,
    unmet_demand DOUBLE NOT NULL,
    satisfaction_percentage DOUBLE NOT NULL
);

-- 6. Dispatched Consignments & Deliveries
CREATE TABLE IF NOT EXISTS shipments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_code VARCHAR(100) NOT NULL UNIQUE,
    allocation_id BIGINT,
    source_depot_id BIGINT NOT NULL,
    destination_point_id BIGINT NOT NULL,
    route_id BIGINT NOT NULL,
    supply_type VARCHAR(50) NOT NULL,
    allocated_quantity DOUBLE NOT NULL,
    delivered_quantity DOUBLE NOT NULL DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, DISPATCHED, DELIVERED, DELAYED, CANCELLED
    driver_name VARCHAR(100),
    driver_phone VARCHAR(50),
    vehicle_plate VARCHAR(50),
    vehicle_type VARCHAR(100) DEFAULT 'Heavy Relief Truck',
    recipient_name VARCHAR(100),
    delivery_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    CONSTRAINT fk_shipment_alloc FOREIGN KEY (allocation_id) REFERENCES allocations(id) ON DELETE SET NULL,
    CONSTRAINT fk_shipment_source FOREIGN KEY (source_depot_id) REFERENCES depots(id) ON DELETE RESTRICT,
    CONSTRAINT fk_shipment_dest FOREIGN KEY (destination_point_id) REFERENCES distribution_points(id) ON DELETE RESTRICT,
    CONSTRAINT fk_shipment_route FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT
);

-- =====================================================================
-- Sample Seed Data (Equivalent to demo scenario)
-- =====================================================================

INSERT INTO depots (id, code, name, latitude, longitude, address, contact_person, phone, max_capacity, status)
VALUES 
(1, 'DEMO-A', 'Central Relief Hub Alpha', 28.6139, 77.2090, 'Connaught Place, New Delhi', 'Col. Rajesh Verma', '+91-9811234567', 5000.0, 'ACTIVE'),
(2, 'DEMO-B', 'Southern Supply Base Beta', 13.0827, 80.2707, 'Anna Nagar, Chennai', 'Maj. Priya Nair', '+91-9845678901', 4000.0, 'ACTIVE');

INSERT INTO inventories (depot_id, supply_type, available_quantity, reserved_quantity, minimum_threshold, unit)
VALUES
(1, 'FOOD', 200.0, 0.0, 50.0, 'kg'),
(1, 'WATER', 500.0, 0.0, 100.0, 'Liters'),
(1, 'MEDICINE', 80.0, 0.0, 15.0, 'Kits'),
(2, 'FOOD', 150.0, 0.0, 30.0, 'kg'),
(2, 'WATER', 350.0, 0.0, 80.0, 'Liters'),
(2, 'MEDICINE', 60.0, 0.0, 10.0, 'Kits');

INSERT INTO distribution_points (id, code, name, latitude, longitude, address, contact_person, phone, severity, priority_score, affected_population, food_demand, water_demand, medicine_demand)
VALUES
(1, 'DEMO-DP1', 'Coastal Flood Zone Alpha', 17.6868, 83.2185, 'Visakhapatnam Port Area, Andhra Pradesh', 'Anitha Reddy', '+91-8912345678', 'CRITICAL', 5, 12000, 80.0, 200.0, 30.0),
(2, 'DEMO-DP2', 'Cyclone Shelter Zone B', 20.2961, 85.8245, 'Puri District, Odisha', 'Mohan Patra', '+91-9437654321', 'HIGH', 4, 8500, 120.0, 280.0, 40.0),
(3, 'DEMO-DP3', 'Hill Tribe Evacuation Camp', 25.5788, 91.8933, 'Shillong Periphery, Meghalaya', 'Bah Joshua Lyngdoh', '+91-9856123456', 'HIGH', 3, 4200, 60.0, 150.0, 25.0),
(4, 'DEMO-DP4', 'Landslide Relief Point Delta', 9.9312, 76.2673, 'Munnar Rural Cluster, Kerala', 'Smt. Leela Krishnan', '+91-9745678123', 'MODERATE', 2, 3100, 80.0, 180.0, 20.0);

INSERT INTO routes (route_code, source_depot_id, destination_point_id, capacity, distance_km, travel_time_hours, road_condition, is_available)
VALUES
('DEMO-R01', 1, 1, 90.0, 1420.0, 24.0, 'CLEAR', TRUE),
('DEMO-R02', 1, 2, 95.0, 1720.0, 28.0, 'FLOOD_RISK', TRUE),
('DEMO-R03', 1, 3, 60.0, 1880.0, 30.0, 'CLEAR', TRUE),
('DEMO-R04', 1, 4, 40.0, 2100.0, 36.0, 'OBSTRUCTED', FALSE),
('DEMO-R05', 2, 1, 70.0, 1240.0, 20.0, 'CLEAR', TRUE),
('DEMO-R06', 2, 2, 80.0, 1450.0, 22.0, 'CLEAR', TRUE),
('DEMO-R07', 2, 3, 50.0, 1680.0, 28.0, 'DAMAGED', FALSE),
('DEMO-R08', 2, 4, 85.0, 380.0, 6.0, 'CLEAR', TRUE);
