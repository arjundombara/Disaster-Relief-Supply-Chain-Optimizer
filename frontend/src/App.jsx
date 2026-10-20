import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import DepotView from './views/DepotView';
import DistributionPointView from './views/DistributionPointView';
import RouteView from './views/RouteView';
import OptimizationView from './views/OptimizationView';
import DeliveryView from './views/DeliveryView';
import ReportsView from './views/ReportsView';
import ScenariosView from './views/ScenariosView';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('admin'); // 'admin' | 'field'

  // Global entity states
  const [stats, setStats] = useState(null);
  const [depots, setDepots] = useState([]);
  const [distributionPoints, setDistributionPoints] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [shipments, setShipments] = useState([]);

  // Optimization computation state
  const [lastFlowResult, setLastFlowResult] = useState(null);
  const [lastAllocationResult, setLastAllocationResult] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);

  // Load all entity data from backend
  const refreshAllData = async () => {
    try {
      const [statsData, depotsData, dpData, routesData, shipmentsData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getDepots().catch(() => []),
        api.getDistributionPoints().catch(() => []),
        api.getRoutes().catch(() => []),
        api.getShipments().catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      if (depotsData) setDepots(depotsData);
      if (dpData) setDistributionPoints(dpData);
      if (routesData) setRoutes(routesData);
      if (shipmentsData) setShipments(shipmentsData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const showAlert = (message, type = 'info') => {
    setAlertBanner({ message, type });
    setTimeout(() => {
      setAlertBanner(null);
    }, 6000);
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
    showAlert(`Disaster location ${data.code} registered.`, 'success');
    await refreshAllData();
  };

  const handleUpdateDP = async (id, data) => {
    await api.updateDistributionPoint(id, data);
    showAlert(`Location updated successfully.`, 'success');
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

  return (
    <div className="app-container">
      {/* Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{
          depots: depots.length,
          locations: distributionPoints.length,
          routes: routes.length,
          shipments: shipments.length
        }}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Navbar
          userRole={userRole}
          setUserRole={setUserRole}
          onLoadDemo={handleLoadDemo}
          onResetDemo={handleResetDemo}
          loadingAction={loadingAction}
          stats={stats}
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
            />
          )}

          {activeTab === 'deliveries' && (
            <DeliveryView
              shipments={shipments}
              onUpdateShipmentStatus={handleUpdateShipmentStatus}
              userRole={userRole}
            />
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
    </div>
  );
}
