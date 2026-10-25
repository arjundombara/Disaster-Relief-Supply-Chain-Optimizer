/**
 * Disaster Relief Supply Chain Optimizer API Client
 * Connects frontend React components to the Spring Boot REST backend.
 */

const BASE_URL = 'https://disaster-relief-supply-chain-optimizer.onrender.com/api';

async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      let errMessage = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errMessage = errorData.message || errorData.error || errMessage;
        if (errorData.details && errorData.details.length > 0) {
          errMessage += ` (${errorData.details.join(', ')})`;
        }
      } catch (e) {
        // Fallback to text
      }
      throw new Error(errMessage);
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Dashboard & Demo Scenarios
  getDashboardStats: () => request('/dashboard/stats'),
  loadDemoData: () => request('/dashboard/demo/load', { method: 'POST' }),
  resetDemoData: () => request('/dashboard/demo/reset', { method: 'DELETE' }),

  // Depots Management (CRUD + Inventory update)
  getDepots: () => request('/depots'),
  getDepotById: (id) => request(`/depots/${id}`),
  createDepot: (data) => request('/depots', { method: 'POST', body: JSON.stringify(data) }),
  updateDepot: (id, data) => request(`/depots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDepot: (id) => request(`/depots/${id}`, { method: 'DELETE' }),
  updateDepotInventory: (id, supplyType, quantity) =>
    request(`/depots/${id}/inventory`, {
      method: 'PATCH',
      body: JSON.stringify({ supplyType, quantity }),
    }),

  // Disaster-Affected Locations (Distribution Points) (CRUD)
  getDistributionPoints: () => request('/distribution-points'),
  getDistributionPointById: (id) => request(`/distribution-points/${id}`),
  createDistributionPoint: (data) => request('/distribution-points', { method: 'POST', body: JSON.stringify(data) }),
  updateDistributionPoint: (id, data) => request(`/distribution-points/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDistributionPoint: (id) => request(`/distribution-points/${id}`, { method: 'DELETE' }),

  // Route Management (CRUD + Availability)
  getRoutes: () => request('/routes'),
  getAvailableRoutes: () => request('/routes/available'),
  getRouteById: (id) => request(`/routes/${id}`),
  createRoute: (data) => request('/routes', { method: 'POST', body: JSON.stringify(data) }),
  updateRoute: (id, data) => request(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoute: (id) => request(`/routes/${id}`, { method: 'DELETE' }),

  // Supply Flow Computation & Optimization
  computeFlow: (supplyType, algorithm = 'EDMONDS_KARP') =>
    request('/flow/compute', {
      method: 'POST',
      body: JSON.stringify({ supplyType, algorithm }),
    }),

  runAllocation: (supplyType, algorithm = 'EDMONDS_KARP', allocationPolicy = 'MAX_FLOW') =>
    request('/allocations/run', {
      method: 'POST',
      body: JSON.stringify({ supplyType, algorithm, allocationPolicy }),
    }),

  getAllocations: () => request('/allocations'),
  getShipments: (status = null) =>
    request(status ? `/allocations/shipments?status=${status}` : '/allocations/shipments'),
  getShipmentById: (id) => request(`/allocations/shipments/${id}`),
  updateShipmentStatus: (id, { status, notes, recipientName, deliveredQuantity }) =>
    request(`/allocations/shipments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes, recipientName, deliveredQuantity }),
    }),
};
