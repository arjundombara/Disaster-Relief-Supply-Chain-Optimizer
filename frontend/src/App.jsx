import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';
import DashboardView from './views/DashboardView';
import DepotView from './views/DepotView';
import DistributionPointView from './views/DistributionPointView';
import RouteView from './views/RouteView';
import OptimizationView from './views/OptimizationView';
import DeliveryView from './views/DeliveryView';
import ReportsView from './views/ReportsView';
import ScenariosView from './views/ScenariosView';
import DisasterView from './views/DisasterView';
import DeliveryApprovalView from './views/DeliveryApprovalView';
import InventoryLedgerView from './views/InventoryLedgerView';
import WorkerDashboardView from './views/WorkerDashboardView';
import { api, authStorage } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authStorage.getUser());
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const user = authStorage.getUser();
    return user?.role === 'WORKER' ? 'worker-console' : 'dashboard';
  });

  // Global entity states
  const [stats, setStats] = useState(null);
  const [depots, setDepots] = useState([]);
  const [distributionPoints, setDistributionPoints] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Optimization computation state
  const [lastFlowResult, setLastFlowResult] = useState(null);
  const [lastAllocationResult, setLastAllocationResult] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);

  // Load all entity data from backend
  const refreshAllData = async () => {
    try {
      const [statsData, depotsData, dpData, routesData, shipmentsData, disastersData, reportsData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getDepots().catch(() => []),
        api.getDistributionPoints().catch(() => []),
        api.getRoutes().catch(() => []),
        api.getShipments().catch(() => []),
        api.getDisasters().catch(() => []),
        api.getDeliveryReports('PENDING_APPROVAL').catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      if (depotsData) setDepots(depotsData);
      if (dpData) setDistributionPoints(dpData);
      if (routesData) setRoutes(routesData);
      if (shipmentsData) setShipments(shipmentsData);
      if (disastersData) setDisasters(disastersData);
      setPendingApprovalsCount((reportsData || []).length);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();

    // Verify token validity on load
    if (authStorage.getToken()) {
      api.getMe().then(user => {
        setCurrentUser(user);
        authStorage.setUser(user);
      }).catch(() => {
        authStorage.clear();
        setCurrentUser(null);
      });
    }

    const handleUnauthorized = () => {
      setCurrentUser(null);
      setIsLoginOpen(true);
      showAlert('Session expired or unauthorized. Please sign in.', 'warning');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const showAlert = (message, type = 'info') => {
    setAlertBanner({ message, type });
    setTimeout(() => {
      setAlertBanner(null);
    }, 6000);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    showAlert(`Welcome, ${user.fullName || user.username}! Connected to Command Center.`, 'success');
    if (user.role === 'WORKER') {
      setActiveTab('worker-console');
    } else {
      setActiveTab('dashboard');
    }
    refreshAllData();
  };

  const handleLogout = () => {
    authStorage.clear();
    setCurrentUser(null);
    showAlert('Signed out of Relief Command.', 'info');
    setActiveTab('dashboard');
  };

  // Demo actions
  const handleLoadDemo = async () => {
    setLoadingAction(true);
    try {
      const res = await api.loadDemoData();
      showAlert(res.message || 'Demo scenario loaded successfully!', 'success');
      await refreshAllData();
    } catch (err) {
      showAlert(err.message || 'Failed to load demo scenario', 'danger');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset network? This will clear all demo routes, zones, and shipments.')) return;
    setLoadingAction(true);
    try {
      await api.resetDemoData();
      showAlert('Disaster network cleared successfully.', 'info');
      setLastFlowResult(null);
      setLastAllocationResult(null);
      await refreshAllData();
    } catch (err) {
      showAlert(err.message || 'Failed to reset demo data', 'danger');
    } finally {
      setLoadingAction(false);
    }
  };

  // Depot handlers
  const handleCreateDepot = async (data) => {
    await api.createDepot(data);
    showAlert(`Depot ${data.code} registered successfully.`, 'success');
    await refreshAllData();
  };

  const handleUpdateDepot = async (id, data) => {
    await api.updateDepot(id, data);
    showAlert(`Depot updated successfully.`, 'success');
    await refreshAllData();
  };

  const handleDeleteDepot = async (id) => {
    await api.deleteDepot(id);
    showAlert('Depot removed from relief registry.', 'info');
    await refreshAllData();
  };

  const handleUpdateInventory = async (depotId, supplyType, quantity) => {
    await api.updateDepotInventory(depotId, supplyType, quantity);
    showAlert(`Inventory updated to ${quantity} for ${supplyType}.`, 'success');
    await refreshAllData();
  };

  // Distribution Point handlers
  const handleCreateDP = async (data) => {
    await api.createDistributionPoint(data);
    showAlert(`Affected Location ${data.name} registered.`, 'success');
    await refreshAllData();
  };

  const handleUpdateDP = async (id, data) => {
    await api.updateDistributionPoint(id, data);
    showAlert(`Affected Location updated.`, 'success');
    await refreshAllData();
  };

  const handleDeleteDP = async (id) => {
    await api.deleteDistributionPoint(id);
    showAlert('Disaster location removed.', 'info');
    await refreshAllData();
  };

  // Route handlers
  const handleCreateRoute = async (data) => {
    await api.createRoute(data);
    showAlert(`Route corridor ${data.routeCode} established.`, 'success');
    await refreshAllData();
  };

  const handleUpdateRoute = async (id, data) => {
    await api.updateRoute(id, data);
    showAlert(`Route corridor ${data.routeCode} updated.`, 'success');
    await refreshAllData();
  };

  const handleDeleteRoute = async (id) => {
    await api.deleteRoute(id);
    showAlert('Route corridor removed from network graph.', 'info');
    await refreshAllData();
  };

  // Optimization handlers
  const handleRunOptimization = async (supplyType, algorithm, allocationPolicy) => {
    setOptimizing(true);
    try {
      const [flowRes, allocRes] = await Promise.all([
        api.computeFlow(supplyType, algorithm),
        api.runAllocation(supplyType, algorithm, allocationPolicy)
      ]);

      setLastFlowResult(flowRes);
      setLastAllocationResult(allocRes);
      showAlert(`Optimization complete! Calculated ${allocRes.totalAllocatedFlow} units under ${allocationPolicy} policy.`, 'success');
      await refreshAllData();
    } catch (err) {
      showAlert(err.message || 'Flow optimization failed.', 'danger');
    } finally {
      setOptimizing(false);
    }
  };

  // Shipment status handler
  const handleUpdateShipmentStatus = async (id, updateData) => {
    await api.updateShipmentStatus(id, updateData);
    showAlert('Shipment status updated and recorded.', 'success');
    await refreshAllData();
  };

  const userRole = currentUser?.role || 'ADMIN';

  return (
    <div className="app-container">
      {/* Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        counts={{
          depots: depots.length,
          locations: distributionPoints.length,
          routes: routes.length,
          shipments: shipments.length,
          disasters: disasters.length,
          pendingApprovals: pendingApprovalsCount
        }}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Navbar
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={handleLogout}
          onLoadDemo={handleLoadDemo}
          onResetDemo={handleResetDemo}
          loadingAction={loadingAction}
          stats={stats}
          onNotificationSelect={() => setActiveTab('disasters')}
        />

        <main className="content-body">
          {alertBanner && (
            <div className={`alert-banner alert-${alertBanner.type}`}>
              <span>{alertBanner.message}</span>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              depots={depots}
              distributionPoints={distributionPoints}
              routes={routes}
              recentShipments={shipments}
              onNavigateToOptimization={() => setActiveTab('optimization')}
              onNavigateToDeliveries={() => setActiveTab('deliveries')}
            />
          )}

          {activeTab === 'disasters' && (
            <DisasterView showAlert={showAlert} />
          )}

          {activeTab === 'depots' && (
            <DepotView
              depots={depots}
              onCreateDepot={handleCreateDepot}
              onUpdateDepot={handleUpdateDepot}
              onDeleteDepot={handleDeleteDepot}
              onUpdateInventory={handleUpdateInventory}
              userRole={userRole}
            />
          )}

          {activeTab === 'locations' && (
            <DistributionPointView
              distributionPoints={distributionPoints}
              onCreateDP={handleCreateDP}
              onUpdateDP={handleUpdateDP}
              onDeleteDP={handleDeleteDP}
              userRole={userRole}
            />
          )}

          {activeTab === 'routes' && (
            <RouteView
              routes={routes}
              depots={depots}
              distributionPoints={distributionPoints}
              onCreateRoute={handleCreateRoute}
              onUpdateRoute={handleUpdateRoute}
              onDeleteRoute={handleDeleteRoute}
              userRole={userRole}
            />
          )}

          {activeTab === 'optimization' && (
            <OptimizationView
              onRunOptimization={handleRunOptimization}
              loading={optimizing}
              lastFlowResult={lastFlowResult}
              lastAllocationResult={lastAllocationResult}
              depots={depots}
              distributionPoints={distributionPoints}
              routes={routes}
              onRefreshData={refreshAllData}
              showAlert={showAlert}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'deliveries' && (
            <DeliveryView
              shipments={shipments}
              onUpdateShipmentStatus={handleUpdateShipmentStatus}
              userRole={userRole}
            />
          )}

          {activeTab === 'approvals' && (
            <DeliveryApprovalView showAlert={showAlert} />
          )}

          {activeTab === 'ledger' && (
            <InventoryLedgerView depots={depots} showAlert={showAlert} />
          )}

          {activeTab === 'worker-console' && (
            <WorkerDashboardView currentUser={currentUser} showAlert={showAlert} />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              stats={stats}
              depots={depots}
              distributionPoints={distributionPoints}
              shipments={shipments}
            />
          )}

          {activeTab === 'scenarios' && (
            <ScenariosView
              onRefreshAllData={refreshAllData}
            />
          )}
        </main>
      </div>

      {/* Login / Registration Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
