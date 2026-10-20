import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function ReliefMap({ depots = [], distributionPoints = [], routes = [], flowEdges = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map if not already created
    if (!mapInstanceRef.current) {
      // Default centered on India / South Asia region
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      // CartoDB Dark Matter tile layer for emergency theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const bounds = [];

    // Custom Depot Icon
    const depotIcon = L.divIcon({
      className: 'custom-depot-marker',
      html: `
        <div style="
          background: #1e3a8a;
          border: 2px solid #38bdf8;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 13px;
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.6);
        ">🏢</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // Helper for DP severity color
    const getSeverityColor = (sev) => {
      switch (sev) {
        case 'CRITICAL': return '#ef4444';
        case 'HIGH': return '#f97316';
        case 'MODERATE': return '#f59e0b';
        case 'LOW': return '#3b82f6';
        default: return '#94a3b8';
      }
    };

    // Render Depots
    depots.forEach((depot) => {
      if (depot.latitude && depot.longitude) {
        const marker = L.marker([depot.latitude, depot.longitude], { icon: depotIcon })
          .bindPopup(`
            <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
              <div style="font-size: 11px; font-weight: bold; color: #2563eb; text-transform: uppercase;">Central Depot (${depot.code})</div>
              <h4 style="margin: 3px 0 6px 0; font-size: 14px;">${depot.name}</h4>
              <div style="font-size: 12px; margin-bottom: 4px;"><strong>Location:</strong> ${depot.address || 'Central Sector'}</div>
              <div style="font-size: 12px; margin-bottom: 4px;"><strong>Storage Capacity:</strong> ${depot.maxCapacity?.toLocaleString()} units</div>
              <div style="font-size: 12px; margin-bottom: 4px;"><strong>Contact:</strong> ${depot.contactPerson || 'Officer in Charge'} (${depot.phone || 'N/A'})</div>
              <div style="font-size: 11px; margin-top: 6px; padding: 4px 6px; background: #e0f2fe; border-radius: 4px; color: #0369a1; font-weight: 600;">
                Food: ${depot.inventories?.find(i => i.supplyType === 'FOOD')?.availableQuantity || 0} kg | 
                Water: ${depot.inventories?.find(i => i.supplyType === 'WATER')?.availableQuantity || 0} L | 
                Meds: ${depot.inventories?.find(i => i.supplyType === 'MEDICINE')?.availableQuantity || 0} kits
              </div>
            </div>
          `);
        layerGroup.addLayer(marker);
        bounds.push([depot.latitude, depot.longitude]);
      }
    });

    // Render Disaster-Affected Locations (Distribution Points)
    distributionPoints.forEach((dp) => {
      if (dp.latitude && dp.longitude) {
        const color = getSeverityColor(dp.severity);
        const dpIcon = L.divIcon({
          className: 'custom-dp-marker',
          html: `
            <div style="
              background: ${color};
              border: 2px solid white;
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 12px;
              box-shadow: 0 0 12px ${color};
            ">⚠️</div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([dp.latitude, dp.longitude], { icon: dpIcon })
          .bindPopup(`
            <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
              <span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
                ${dp.severity} PRIORITY (Score: ${dp.priorityScore}/5)
              </span>
              <h4 style="margin: 6px 0 4px 0; font-size: 14px;">${dp.name} (${dp.code})</h4>
              <div style="font-size: 12px; margin-bottom: 3px;"><strong>Population Affected:</strong> ${dp.affectedPopulation?.toLocaleString()} people</div>
              <div style="font-size: 12px; margin-bottom: 3px;"><strong>Address:</strong> ${dp.address || 'Disaster Zone'}</div>
              <div style="font-size: 11px; margin-top: 6px; padding: 4px 6px; background: #fee2e2; border-radius: 4px; color: #991b1b; font-weight: 600;">
                DEMAND: Food ${dp.foodDemand || 0} kg | Water ${dp.waterDemand || 0} L | Meds ${dp.medicineDemand || 0} kits
              </div>
            </div>
          `);
        layerGroup.addLayer(marker);
        bounds.push([dp.latitude, dp.longitude]);
      }
    });

    // Render Routes
    routes.forEach((route) => {
      const src = depots.find(d => d.id === route.sourceDepotId || d.code === route.sourceDepotCode);
      const dst = distributionPoints.find(dp => dp.id === route.destinationPointId || dp.code === route.destinationPointCode);

      if (src?.latitude && src?.longitude && dst?.latitude && dst?.longitude) {
        const isBlocked = !route.isAvailable;
        const color = isBlocked ? '#ef4444' : '#10b981';
        const dashArray = isBlocked ? '6, 8' : null;

        // Check if there is active flow on this route
        const flowInfo = flowEdges.find(e => e.label === route.routeCode || e.from === src.code);
        const flowQty = flowInfo ? flowInfo.flow : 0;
        const weight = flowQty > 0 ? 5 : (isBlocked ? 2.5 : 3.5);

        const polyline = L.polyline([
          [src.latitude, src.longitude],
          [dst.latitude, dst.longitude]
        ], {
          color: flowQty > 0 ? '#38bdf8' : color,
          weight: weight,
          opacity: isBlocked ? 0.6 : 0.85,
          dashArray: dashArray,
        }).bindPopup(`
          <div style="font-family: sans-serif; color: #1e293b; padding: 2px;">
            <div style="font-weight: bold; font-size: 12px; color: ${isBlocked ? '#dc2626' : '#059669'};">
              ${isBlocked ? '⛔ ROUTE BLOCKED / IMPASSABLE' : '✅ AVAILABLE RELIEF CORRIDOR'}
            </div>
            <div style="font-size: 12px; margin-top: 4px;"><strong>Route:</strong> ${route.routeCode} (${src.name} → ${dst.name})</div>
            <div style="font-size: 12px;"><strong>Max Capacity:</strong> ${route.capacity} units</div>
            <div style="font-size: 12px;"><strong>Distance:</strong> ${route.distanceKm || 'N/A'} km | <strong>Travel Time:</strong> ${route.travelTimeHours || 'N/A'} hrs</div>
            ${flowQty > 0 ? `<div style="margin-top: 4px; padding: 2px 6px; background: #e0f2fe; color: #0284c7; font-weight: bold; border-radius: 4px; font-size: 11px;">⚡ Active Allocated Flow: ${flowQty} units</div>` : ''}
          </div>
        `);
        layerGroup.addLayer(polyline);
      }
    });

    // Auto-fit bounds if markers exist
    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
      } catch (e) {
        // Fallback zoom
      }
    }
  }, [depots, distributionPoints, routes, flowEdges]);

  return (
    <div className="map-container">
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
