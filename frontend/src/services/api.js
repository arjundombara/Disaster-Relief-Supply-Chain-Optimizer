/**
 * Disaster Relief Supply Chain Optimizer API Client
 * Connects frontend React components to the Spring Boot REST backend with JWT authentication.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const authStorage = {
  getToken: () => localStorage.getItem('relief_jwt_token'),
  setToken: (token) => {
    if (token) localStorage.setItem('relief_jwt_token', token);
    else localStorage.removeItem('relief_jwt_token');
  },
  getUser: () => {
    try {
      const u = localStorage.getItem('relief_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },
  setUser: (user) => {
    if (user) localStorage.setItem('relief_user', JSON.stringify(user));
    else localStorage.removeItem('relief_user');
  },
  clear: () => {
    localStorage.removeItem('relief_jwt_token');
    localStorage.removeItem('relief_user');
  }
};

async function request(endpoint, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch (networkError) {
    console.error(`Network error on ${endpoint}:`, networkError);
    throw new Error(
      'Unable to connect to the backend server. Please verify that the Spring Boot service is running on port 8080.'
    );
  }

  if (!response.ok) {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error(
        `Backend service unavailable (HTTP ${response.status} ${response.statusText}). Please ensure the Spring Boot server is running on port 8080.`
      );
    }

    let errMessage = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errMessage = errorData.message || errorData.error || errMessage;
      if (errorData.details && errorData.details.length > 0) {
        const uniqueDetails = errorData.details.filter(d => d !== errorData.message && d !== errMessage);
        if (uniqueDetails.length > 0) {
          errMessage += ` (${uniqueDetails.join(', ')})`;
        }
      }
    } catch (e) {
      // Fallback to text
    }

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      authStorage.clear();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    throw new Error(errMessage);
  }

  if (response.status === 204) return null;
  return await response.json();
}

export const api = {
  // Authentication & RBAC
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  setupAdmin: (data) => request('/auth/setup-admin', { method: 'POST', body: JSON.stringify(data) }),
  registerWorkerSelf: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  registerWorker: (data) => request('/users/workers', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  hasAdmin: () => request('/auth/has-admin'),

  // Workers & User Management (Authorized Admin Operations)
  getWorkers: () => request('/users/workers'),
  getUserRequests: () => request('/users/requests'),
  getWorkerById: (id) => request(`/users/${id}`),
  approveWorker: (id) => request(`/users/${id}/approve`, { method: 'POST' }),
  rejectWorker: (id) => request(`/users/${id}/reject`, { method: 'POST' }),
  updateWorkerApproval: (id, status) => request(`/users/${id}/approval`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  createWorker: (data) => request('/users/workers', { method: 'POST', body: JSON.stringify(data) }),
  toggleWorkerStatus: (id, active) => request(`/users/${id}/status?active=${active}`, { method: 'PATCH' }),

  // Dashboard & Demo Scenarios
  getDashboardStats: () => request('/dashboard/stats'),
  loadDemoData: () => request('/dashboard/demo/load', { method: 'POST' }),
  resetDemoData: () => request('/dashboard/demo/reset', { method: 'DELETE' }),

  // Disasters Management
  getDisasters: () => request('/disasters'),
  getActiveDisasters: () => request('/disasters/active'),
  getDisasterById: (id) => request(`/disasters/${id}`),
  createDisaster: (data) => request('/disasters', { method: 'POST', body: JSON.stringify(data) }),
  updateDisaster: (id, data) => request(`/disasters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDisaster: (id) => request(`/disasters/${id}`, { method: 'DELETE' }),

  // Official Instructions
  getInstructions: (disasterId = null) =>
    request(disasterId ? `/instructions?disasterId=${disasterId}` : '/instructions'),
  getInstructionById: (id) => request(`/instructions/${id}`),
  createInstruction: (data) => request('/instructions', { method: 'POST', body: JSON.stringify(data) }),
  updateInstruction: (id, data) => request(`/instructions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInstruction: (id) => request(`/instructions/${id}`, { method: 'DELETE' }),

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

  // Inventory Ledger & Reconciliation
  getDepotInventory: (depotId) => request(`/inventory/depot/${depotId}`),
  getInventoryTransactions: (depotId = null) =>
    request(depotId ? `/inventory/transactions?depotId=${depotId}` : '/inventory/transactions'),
  adjustInventory: (depotId, data) =>
    request(`/inventory/depot/${depotId}/adjust`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Disaster-Affected Locations (Distribution Points) (CRUD)
  getDistributionPoints: (disasterId = null) =>
    request(disasterId ? `/distribution-points?disasterId=${disasterId}` : '/distribution-points'),
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
  approvePlan: (planId) => request(`/allocations/plans/${planId}/approve`, { method: 'POST' }),

  // Shipments & Field Worker Tasks
  getShipments: (status = null, workerId = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (workerId) params.append('workerId', workerId);
    const qs = params.toString();
    return request(qs ? `/allocations/shipments?${qs}` : '/allocations/shipments');
  },
  getShipmentById: (id) => request(`/allocations/shipments/${id}`),
  updateShipmentStatus: (id, { status, notes, recipientName, deliveredQuantity }) =>
    request(`/allocations/shipments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes, recipientName, deliveredQuantity }),
    }),
  assignShipmentWorker: (shipmentId, assignmentData) =>
    request(`/allocations/shipments/${shipmentId}/assign`, {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    }),
  acknowledgeShipment: (shipmentId) =>
    request(`/allocations/shipments/${shipmentId}/acknowledge`, { method: 'POST' }),

  // Delivery Reports & Admin Approvals
  getDeliveryReports: (status = null) =>
    request(status ? `/delivery-reports?status=${status}` : '/delivery-reports'),
  getDeliveryReportById: (id) => request(`/delivery-reports/${id}`),
  createDeliveryReport: (reportData) =>
    request('/delivery-reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    }),
  reviewDeliveryReport: (id, reviewData) =>
    request(`/delivery-reports/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    }),

  // Notifications
  getNotifications: (unreadOnly = false) =>
    request(`/notifications?unreadOnly=${unreadOnly}`),
  markNotificationAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsAsRead: () => request('/notifications/read-all', { method: 'POST' }),
};
