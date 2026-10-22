
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function ReliefMap({
  depots = [],
  distributionPoints = [],
  routes = [],
  flowEdges = [],
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Initialize the map only once and clean it up on unmount.
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    // OpenStreetMap tiles: no CARTO API key required.
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Recalculate dimensions after the map container renders.
    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update markers, routes, and popups whenever data changes.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;

    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds = [];

    const hasCoordinates = (item) =>
      item?.latitude != null &&
      item?.longitude != null &&
      Number.isFinite(Number(item.latitude)) &&
      Number.isFinite(Number(item.longitude)) &&
      Number(item.latitude) >= -90 &&
      Number(item.latitude) <= 90 &&
      Number(item.longitude) >= -180 &&
      Number(item.longitude) <= 180;

    const getPosition = (item) => [
      Number(item.latitude),
      Number(item.longitude),
    ];

    const depotIcon = L.divIcon({
      className: 'custom-depot-marker',
      html: `
        <div style="
          background:#1e3a8a;
          border:2px solid #38bdf8;
          color:white;
          width:32px;
          height:32px;
          border-radius:8px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:bold;
          font-size:13px;
          box-shadow:0 0 14px rgba(56,189,248,.6);
        ">🏢</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'CRITICAL':
          return '#ef4444';
        case 'HIGH':
          return '#f97316';
        case 'MODERATE':
          return '#f59e0b';
        case 'LOW':
          return '#3b82f6';
        default:
          return '#94a3b8';
      }
    };

    // Render central depots.
    depots.forEach((depot) => {
      if (!hasCoordinates(depot)) return;

      const marker = L.marker(getPosition(depot), {
        icon: depotIcon,
      }).bindPopup(`
        <div style="font-family:sans-serif;color:#1e293b;padding:4px">
          <div style="font-size:11px;font-weight:bold;color:#2563eb;text-transform:uppercase">
            Central Depot (${depot.code ?? 'N/A'})
          </div>
          <h4 style="margin:3px 0 6px;font-size:14px">
            ${depot.name ?? 'Unnamed Depot'}
          </h4>
          <div style="font-size:12px;margin-bottom:4px">
            <strong>Location:</strong> ${depot.address || 'Central Sector'}
          </div>
          <div style="font-size:12px;margin-bottom:4px">
            <strong>Storage Capacity:</strong>
            ${Number(depot.maxCapacity ?? 0).toLocaleString()} units
          </div>
          <div style="font-size:12px;margin-bottom:4px">
            <strong>Contact:</strong> ${depot.contactPerson || 'Officer in Charge'}
            (${depot.phone || 'N/A'})
          </div>
          <div style="font-size:11px;margin-top:6px;padding:4px 6px;background:#e0f2fe;border-radius:4px;color:#0369a1;font-weight:600">
            Food: ${depot.inventories?.find(i => i.supplyType === 'FOOD')?.availableQuantity ?? 0} kg |
            Water: ${depot.inventories?.find(i => i.supplyType === 'WATER')?.availableQuantity ?? 0} L |
            Meds: ${depot.inventories?.find(i => i.supplyType === 'MEDICINE')?.availableQuantity ?? 0} kits
          </div>
        </div>
      `);

      layerGroup.addLayer(marker);
      bounds.push(getPosition(depot));
    });

    // Render disaster-affected distribution points.
    distributionPoints.forEach((dp) => {
      if (!hasCoordinates(dp)) return;

      const color = getSeverityColor(dp.severity);

      const dpIcon = L.divIcon({
        className: 'custom-dp-marker',
        html: `
          <div style="
            background:${color};
            border:2px solid white;
            color:white;
            width:30px;
            height:30px;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            font-weight:bold;
            font-size:12px;
            box-shadow:0 0 12px ${color};
          ">⚠️</div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker(getPosition(dp), {
        icon: dpIcon,
      }).bindPopup(`
        <div style="font-family:sans-serif;color:#1e293b;padding:4px">
          <span style="background:${color};color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;text-transform:uppercase">
            ${dp.severity ?? 'UNKNOWN'} PRIORITY (Score: ${dp.priorityScore ?? 'N/A'}/5)
          </span>
          <h4 style="margin:6px 0 4px;font-size:14px">
            ${dp.name ?? 'Unnamed Location'} (${dp.code ?? 'N/A'})
          </h4>
          <div style="font-size:12px;margin-bottom:3px">
            <strong>Population Affected:</strong>
            ${Number(dp.affectedPopulation ?? 0).toLocaleString()} people
          </div>
          <div style="font-size:12px;margin-bottom:3px">
            <strong>Address:</strong> ${dp.address || 'Disaster Zone'}
          </div>
          <div style="font-size:11px;margin-top:6px;padding:4px 6px;background:#fee2e2;border-radius:4px;color:#991b1b;font-weight:600">
            DEMAND: Food ${dp.foodDemand ?? 0} kg |
            Water ${dp.waterDemand ?? 0} L |
            Meds ${dp.medicineDemand ?? 0} kits
          </div>
        </div>
      `);

      layerGroup.addLayer(marker);
      bounds.push(getPosition(dp));
    });

    // Render relief routes between depots and distribution points.
    routes.forEach((route) => {
      const src = depots.find(
        (d) =>
          (route.sourceDepotId != null && d.id === route.sourceDepotId) ||
          (route.sourceDepotCode != null &&
            d.code === route.sourceDepotCode)
      );

      const dst = distributionPoints.find(
        (dp) =>
          (route.destinationPointId != null &&
            dp.id === route.destinationPointId) ||
          (route.destinationPointCode != null &&
            dp.code === route.destinationPointCode)
      );

      if (!src || !dst || !hasCoordinates(src) || !hasCoordinates(dst)) {
        return;
      }

      const isBlocked = route.isAvailable === false;
      const color = isBlocked ? '#ef4444' : '#10b981';
      const flowInfo = flowEdges.find(
        (edge) =>
          (edge.label != null && edge.label === route.routeCode) ||
          (edge.from != null && edge.from === src.code)
      );

      const flowQty = Number(flowInfo?.flow ?? 0);
      const weight = flowQty > 0 ? 5 : isBlocked ? 2.5 : 3.5;

      const polyline = L.polyline(
        [getPosition(src), getPosition(dst)],
        {
          color: flowQty > 0 ? '#38bdf8' : color,
          weight,
          opacity: isBlocked ? 0.6 : 0.85,
          dashArray: isBlocked ? '6, 8' : null,
        }
      ).bindPopup(`
        <div style="font-family:sans-serif;color:#1e293b;padding:2px">
          <div style="font-weight:bold;font-size:12px;color:${isBlocked ? '#dc2626' : '#059669'}">
            ${isBlocked ? '⛔ ROUTE BLOCKED / IMPASSABLE' : '✅ AVAILABLE RELIEF CORRIDOR'}
          </div>
          <div style="font-size:12px;margin-top:4px">
            <strong>Route:</strong> ${route.routeCode ?? 'N/A'}
            (${src.name ?? src.code ?? 'Depot'} →
            ${dst.name ?? dst.code ?? 'Distribution Point'})
          </div>
          <div style="font-size:12px">
            <strong>Max Capacity:</strong> ${route.capacity ?? 0} units
          </div>
          <div style="font-size:12px">
            <strong>Distance:</strong> ${route.distanceKm ?? 'N/A'} km |
            <strong>Travel Time:</strong> ${route.travelTimeHours ?? 'N/A'} hrs
          </div>
          ${
            flowQty > 0
              ? `<div style="margin-top:4px;padding:2px 6px;background:#e0f2fe;color:#0284c7;font-weight:bold;border-radius:4px;font-size:11px">
                  ⚡ Active Allocated Flow: ${flowQty} units
                </div>`
              : ''
          }
        </div>
      `);

      layerGroup.addLayer(polyline);
    });

    // Fit the map to the available depot and distribution-point markers.
    if (bounds.length > 0) {
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 8,
      });
    } else {
      map.setView([20.5937, 78.9629], 5);
    }

    // Leaflet needs this when its container size changes.
    requestAnimationFrame(() => {
      map.invalidateSize();
    });
  }, [depots, distributionPoints, routes, flowEdges]);

  return (
    <div className="map-container">
      <div
        ref={mapContainerRef}
        style={{
          height: '100%',
          width: '100%',
          minHeight: '400px',
        }}
      />
    </div>
  );
}
