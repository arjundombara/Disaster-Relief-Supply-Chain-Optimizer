# Disaster Relief Supply Chain Optimizer
**Problem Statement No. 111**
*A Full-Stack Humanitarian Logistics Optimization Platform using Network Flow Algorithms & Priority Triage*

---

## 🌟 Executive Overview
During large-scale natural disasters (cyclones, floods, landslides, earthquakes), emergency response centers struggle with:
1. **Severe Transportation Bottlenecks**: Damaged roads, collapsed bridges, and restricted corridor capacities.
2. **Resource Scarcity**: Demands for food, potable water, and emergency medical kits frequently exceed immediate stockpiles.
3. **Distribution Inequity**: Standard algorithms maximize volume throughput indiscriminately, starving isolated critical triage zones.

The **Disaster Relief Supply Chain Optimizer** resolves this by integrating **Edmonds–Karp Maximum-Flow Algorithm** ($O(V \cdot E^2)$ runtime guarantee) with a **Priority-Weighted Humanitarian Triage Engine**. This ensures that maximum physical aid throughput is computed across capacitated road networks while honoring emergency severity levels (Critical, High, Moderate, Low) and proportional fairness policies.

---

## 🛠️ Technology Stack

| Layer | Technology | Role & Notes |
|---|---|---|
| **Frontend** | React 19, JavaScript (ES6+), Vite 8 | Ultra-fast responsive UI, modern component architecture |
| **Styling** | Vanilla CSS3 (EOC Dark Theme) | Custom CSS design tokens, emergency alert red highlights, cards, modals |
| **Mapping & GIS** | Leaflet 1.9 + CartoDB Dark Matter / OpenStreetMap | Live topology of depots, disaster zones (pulsing markers), and road corridors |
| **Icons & Visuals** | Lucide-React | Crisp tactical icons for emergency logistics |
| **Backend** | Java 11, Spring Boot 2.7.18, Spring Data JPA | Robust REST API, Bean validation, transactional service layer |
| **Max-Flow Algorithm** | Custom Object-Oriented Graph Engine | **Edmonds-Karp** (BFS augmenting paths) & **Dinic's Algorithm** (Level graphs) |
| **Database** | H2 (in-memory persistent mode) + MySQL `schema.sql` | Zero-configuration immediate testability + production MySQL migration script |
| **API Docs** | Springdoc OpenAPI 3.0 / Swagger UI | Interactive endpoint explorer available at `/swagger-ui.html` |
| **Testing** | JUnit 5, MockMvc, AssertJ, Hamcrest | 32 automated unit and integration tests passing with 100% success rate |

---

## 🏛️ Project Directory Structure

```
disaster-relief-optimizer/
│
├── schema.sql                         # Standard MySQL / Relational DDL schema & seed data
├── README.md                          # Comprehensive project documentation & demo guide
├── mvn.cmd                            # Portable Apache Maven wrapper
│
├── backend/                           # Java Spring Boot Microservice
│   ├── pom.xml                        # Maven dependencies & build lifecycle
│   └── src/
│       ├── main/
│       │   ├── java/com/relief/optimizer/
│       │   │   ├── OptimizerApplication.java
│       │   │   ├── algorithm/         # Flow Network, Edmonds-Karp, Dinic, AugmentingPathStep
│       │   │   ├── config/            # CORS configuration, OpenAPI documentation
│       │   │   ├── controller/        # REST Controllers (Depot, Zone, Route, Flow, Allocations, Dashboard)
│       │   │   ├── dto/               # Data Transfer Objects & validation annotations
│       │   │   ├── exception/         # Global Exception Handler & status transitions
│       │   │   ├── model/             # JPA Entities (Depot, Inventory, DistributionPoint, Route, Shipment)
│       │   │   ├── repository/        # Spring Data JPA Repositories
│       │   │   └── service/           # Business Logic (MaxFlowService, AllocationService, DemoDataService)
│       │   └── resources/
│       │       └── application.properties # Server port 8080, H2 database, OpenAPI paths
│       └── test/                      # 32 Integration and Unit Tests
│           └── java/com/relief/optimizer/
│               ├── algorithm/         # EdmondsKarpMaxFlowTest, DinicsMaxFlowTest
│               ├── controller/        # DepotControllerIntegrationTest
│               └── service/           # AllocationServiceTest
│
└── frontend/                          # React + Vite Web Application
    ├── package.json                   # React, Vite, Lucide, Leaflet dependencies
    ├── vite.config.js                 # Proxy config pointing /api -> http://localhost:8080
    ├── index.html                     # Google Fonts (Inter, JetBrains Mono) & Leaflet styles
    └── src/
        ├── index.css                  # EOC Dark Mode Design System
        ├── main.jsx                   # React DOM root entry
        ├── App.jsx                    # State coordinator, role manager, tab router
        ├── services/
        │   └── api.js                 # Unified REST client with error wrapping
        ├── components/
        │   ├── Navbar.jsx             # Top bar with clock, DEFCON badge, role selector
        │   ├── Sidebar.jsx            # Fixed sidebar with live count badges
        │   └── ReliefMap.jsx          # Interactive Leaflet OpenStreetMap
        └── views/
            ├── DashboardView.jsx      # KPI cards, topological map, supply meters
            ├── DepotView.jsx          # Depot CRUD & Inventory stock manager
            ├── DistributionPointView.jsx # Disaster Zone triage (Critical -> Low)
            ├── RouteView.jsx          # Corridors, capacities, and blocked-toggle
            ├── OptimizationView.jsx   # Edmonds-Karp solver & augmenting path log
            ├── DeliveryView.jsx       # Consignment lifecycle (Pending -> Delivered)
            ├── ReportsView.jsx        # Summary analytics & CSV export
            └── ScenariosView.jsx      # Preset runner for Scenarios 1 to 8
```

---

## 🚀 Step-by-Step Execution Guide

### 1. Prerequisites
- **Java 11 or higher** installed.
- **Node.js v18+ and npm** installed.
- *Note:* Maven 3.9.6 is pre-bundled in the `tools/` folder and accessible via `.\mvn.cmd`.

### 2. Running Backend
Open a terminal in `scratch/disaster-relief-optimizer/backend`:
```powershell
# Compile, run all 32 unit and integration tests:
.\mvn.cmd test

# Start the Spring Boot Application:
.\mvn.cmd spring-boot:run
```
The backend initializes on `http://localhost:8080`.
- **OpenAPI Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **H2 Web Database Console:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:mem:reliefdb`, user: `sa`, password: empty)

### 3. Running Frontend
Open a separate terminal in `scratch/disaster-relief-optimizer/frontend`:
```powershell
# Install frontend dependencies:
npm install

# Start Vite dev server:
npm run dev
```
Open your browser to: **`http://localhost:5173/`**

---

## 🧮 Algorithm & Optimization Deep Dive

### 1. Network Construction & Transformation
Because multiple central depots supply multiple affected locations, standard single-source single-sink max flow algorithms cannot be directly applied. We transform the supply chain into a standard flow network $G' = (V', E')$:
1. **Super-Source ($S$)**: Directed edges from $S$ to each Central Depot $D_i$ with capacity equal to depot $D_i$'s available inventory of that specific supply type.
2. **Transportation Corridors ($D_i \to Z_j$)**: Directed edges between depot $D_i$ and disaster location $Z_j$ with capacity equal to the route capacity $C_{ij}$. Blocked or impassable routes ($isAvailable = false$) are assigned capacity $0$.
3. **Super-Sink ($T$)**: Directed edges from each disaster location $Z_j$ to $T$ with capacity equal to location $Z_j$'s demanded quantity $Demand_j$.

### 2. Edmonds-Karp Execution
- Uses **Breadth-First Search (BFS)** to find the shortest augmenting path (fewest edges) from $S$ to $T$ in the residual graph $G_f$.
- Pushes bottleneck capacity $\Delta = \min_{(u,v) \in p} c_f(u,v)$ along the path.
- Updates residual capacities: $c_f(u,v) \leftarrow c_f(u,v) - \Delta$ and $c_f(v,u) \leftarrow c_f(v,u) + \Delta$.
- Repeats until no path exists in $G_f$.
- **Runtime Complexity:** $O(V \cdot E^2)$, avoiding infinite loops with real-valued capacities.

### 3. Separation of Max-Flow Throughput and Fairness Triage
*Crucial Principle:* Maximum flow maximizes total units delivered across network bottlenecks, but treats all destinations identically. Our platform decouples this into two stages:
- **Stage 1 (Physical Bottleneck Bound):** Run Edmonds-Karp to determine the maximum deliverable flow $\Phi_{max}$.
- **Stage 2 (Fairness & Priority Triage Policy):**
  - **`MAX_FLOW`**: Direct flow assignments maximizing total delivery throughput.
  - **`PRIORITY_WEIGHTED`**: Triage allocation satisfying Priority 5 (Critical) and Priority 4 (High) emergency zones first before lower severity areas receive resources.
  - **`PROPORTIONAL`**: Allocates supplies in direct proportion to each zone's demand share ($Alloc_j = \Phi_{max} \cdot \frac{Demand_j}{\sum Demand}$).

---

## 🧪 Comprehensive Verification of the 8 Test Scenarios (Section 5)

| # | Test Scenario | Expected Outcome | System Validation |
|---|---|---|---|
| **1** | **Sufficient inventory & available routes** | 100% of demanded food/water/meds delivered with zero unmet demand. | ✅ Verified via EdmondsKarpMaxFlowTest (Max Flow = Demand). |
| **2** | **Insufficient food, water, or medicine** | Allocation capped exactly at total available depot inventory; unmet demand recorded without over-allocation. | ✅ Verified via AllocationServiceTest (Allocated $\le$ Inventory). |
| **3** | **Blocked transportation route** | Route marked `isAvailable=false`; flow engine strictly routes 0 units through blocked link; reroutes via open paths. | ✅ Verified in DinicsMaxFlowTest & ScenariosView live test. |
| **4** | **Multiple locations with different emergency priorities** | Critical zones (Priority 5) satisfied before Moderate zones (Priority 2) receive aid. | ✅ Verified via AllocationServiceTest under `PRIORITY_WEIGHTED` policy. |
| **5** | **Route with limited capacity** | Bottleneck corridor saturates at 100% capacity; algorithm identifies it as a critical bottleneck. | ✅ Verified in FlowResult.bottleneckRoutes list. |
| **6** | **Location with unmet demand** | Mathematical conservation: $Unmet = Demanded - Delivered$; correct shortage alerts generated. | ✅ Verified in AllocationService.runAllocation calculation. |
| **7** | **Adding, editing, and deleting a depot** | Complete CRUD cycle with database persistence, capacity validation, and 204 No Content cleanup. | ✅ Verified in DepotControllerIntegrationTest (`testCreateDepot`, `testRetrieveDepot`, `testDeleteDepot`). |
| **8** | **Updating delivery status and inventory** | Shipment lifecycle: `PENDING` $\to$ `DISPATCHED` $\to$ `DELIVERED`; records signoff; rejects invalid transitions. | ✅ Verified in `testRejectInvalidStatusTransition` & DeliveryView verification modal. |

---

## 👥 Role-Based Access Control
- **Commander (Administrator)**: Full CRUD permissions to add/edit/delete relief depots, declare disaster zones, create route corridors, and toggle road blockages.
- **Field Worker**: Operational access to execute supply optimizations, monitor active dispatches, mark deliveries received, record actual verified quantities, and log delivery signoffs.
