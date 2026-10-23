
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

  // Initialize the map once and clean it up on unmount.
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    // OpenStreetMap tiles do not require a CARTO API key.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    requestAnimationFrame(() => {
      if (mapInstanceRef.current === map) {
        map.invalidateSize();
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Refresh markers, popups, and routes when data changes.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;

    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds = [];

    const hasCoordinates = (item) => {
      if (item?.latitude == null || item?.longitude == null) {
        return false;
      }

      const latitude = Number(item.latitude);
      const longitude = Number(item.longitude);

      return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      );
    };

    const coordinates = (item) => [
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
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const getSeverityColor = (severity) => {
      switch (String(severity || '').toUpperCase()) {
        case 'CRITICAL':
          return '#ef4444';
        case 'HIGH':
          return '#f97316';
        case 'MODERATE':
        case 'MEDIUM':
          return '#f59e0b';
        case 'LOW':
          return '#3b82f6';
        default:
          return '#94a3b8';
      }
    };

    // Draw central relief depots.
    depots.forEach((depot) => {
      if (!hasCoordinates(depot)) return;

      const food =
        depot.inventories?.find((i) => i.supplyType === 'FOOD')
          ?.availableQuantity ?? 0;
      const water =
        depot.inventories?.find((i) => i.supplyType === 'WATER')
          ?.availableQuantity ?? 0;
      const medicine =
        depot.inventories?.find((i) => i.supplyType === 'MEDICINE')
          ?.availableQuantity ?? 0;

      const marker = L.marker(coordinates(depot), {
        icon: depotIcon,
      }).bindPopup(`
        <div style="font-family:sans-serif;color:#1e293b;padding:4px">
          <div style="font-size:11px;font-weight:bold;color:#2563eb;text-transform:uppercase">
            Central Depot (${depot.code ?? 'N/A'})
          </div>
          <h4 style="margin:5px 0;font-size:14px">
            ${depot.name ?? 'Relief Depot'}
          </h4>
          <div><strong>Location:</strong> ${depot.address ?? 'Central Sector'}</div>
          <div><strong>Storage Capacity:</strong> ${depot.maxCapacity ?? 0} units</div>
          <div><strong>Contact:</strong> ${depot.contactPerson ?? 'Officer in Charge'}</div>
          <div><strong>Phone:</strong> ${depot.phone ?? 'N/A'}</div>
          <hr/>
          <div style="font-size:12px;background:#e0f2fe;padding:6px;border-radius:4px">
            <strong>Food:</strong> ${food} kg<br/>
            <strong>Water:</strong> ${water} L<br/>
            <strong>Medicine:</strong> ${medicine} kits
          </div>
        </div>
      `);

      layerGroup.addLayer(marker);
      bounds.push(coordinates(depot));
    });

    // Draw disaster-affected distribution points.
    distributionPoints.forEach((point) => {
      if (!hasCoordinates(point)) return;

      const color = getSeverityColor(point.severity);

      const pointIcon = L.divIcon({
        className: 'custom-dp-marker',
        html: `
          <div style="
            background:${color};
            border:2px solid white;
            color:white;
            width:32px;
            height:32px;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:13px;
            box-shadow:0 0 12px ${color};
          ">⚠</div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker(coordinates(point), {
        icon: pointIcon,
      }).bindPopup(`
        <div style="font-family:sans-serif;color:#1e293b;padding:4px">
          <strong style="color:${color}">
            ${point.severity ?? 'UNKNOWN'} PRIORITY
            (Score: ${point.priorityScore ?? 'N/A'}/5)
          </strong>
          <h4 style="margin:6px 0;font-size:14px">
            ${point.name ?? 'Affected Location'} (${point.code ?? 'N/A'})
          </h4>
          <div><strong>Population Affected:</strong>
            ${Number(point.affectedPopulation ?? 0).toLocaleString()} people
          </div>
          <div><strong>Address:</strong> ${point.address ?? 'Disaster Zone'}</div>
          <hr/>
          <div style="background:#fee2e2;padding:6px;border-radius:4px">
            <strong>Food Demand:</strong> ${point.foodDemand ?? 0} kg<br/>
            <strong>Water Demand:</strong> ${point.waterDemand ?? 0} L<br/>
            <strong>Medicine Demand:</strong> ${point.medicineDemand ?? 0} kits
          </div>
        </div>
      `);

      layerGroup.addLayer(marker);
      bounds.push(coordinates(point));
    });

    // Draw transport routes between depots and disaster zones.
    routes.forEach((route) => {
      const source = depots.find(
        (depot) =>
          (route.sourceDepotId != null &&
            String(depot.id) === String(route.sourceDepotId)) ||
          (route.sourceDepotCode != null &&
            depot.code === route.sourceDepotCode)
      );

      const destination = distributionPoints.find(
        (point) =>
          (route.destinationPointId != null &&
            String(point.id) === String(route.destinationPointId)) ||
          (route.destinationPointCode != null &&
            point.code === route.destinationPointCode)
      );

      if (
        !source ||
        !destination ||
        !hasCoordinates(source) ||
        !hasCoordinates(destination)
      ) {
        return;
      }

      const isBlocked =
        route.isAvailable === false ||
        String(route.isAvailable).toLowerCase() === 'false';

      const flowInfo = flowEdges.find(
        (edge) =>
          (edge.label != null && edge.label === route.routeCode) ||
          (edge.routeCode != null && edge.routeCode === route.routeCode) ||
          (edge.from != null && edge.from === source.code)
      );

      const flowQuantity = Number(flowInfo?.flow ?? 0);
      const color = isBlocked
        ? '#ef4444'
        : flowQuantity > 0
          ? '#38bdf8'
          : '#10b981';

      const line = L.polyline(
        [coordinates(source), coordinates(destination)],
        {
          color,
          weight: flowQuantity > 0 ? 5 : 3,
          opacity: isBlocked ? 0.7 : 0.9,
          dashArray: isBlocked ? '6, 8' : null,
        }
      ).bindPopup(`
        <div style="font-family:sans-serif;color:#1e293b;padding:4px">
          <strong style="color:${isBlocked ? '#dc2626' : '#059669'}">
            ${isBlocked ? 'ROUTE BLOCKED' : 'AVAILABLE RELIEF CORRIDOR'}
          </strong>
          <div><strong>Route:</strong> ${route.routeCode ?? 'N/A'}</div>
          <div><strong>From:</strong> ${source.name ?? source.code ?? 'Depot'}</div>
          <div><strong>To:</strong> ${destination.name ?? destination.code ?? 'Location'}</div>
          <div><strong>Maximum Capacity:</strong> ${route.capacity ?? 0} units</div>
          <div><strong>Distance:</strong> ${route.distanceKm ?? 'N/A'} km</div>
          <div><strong>Travel Time:</strong> ${route.travelTimeHours ?? 'N/A'} hours</div>
          <div><strong>Allocated Flow:</strong> ${flowQuantity} units</div>
        </div>
      `);

      layerGroup.addLayer(line);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 8,
      });
    } else {
      map.setView([20.5937, 78.9629], 5);
    }

    requestAnimationFrame(() => {
      if (mapInstanceRef.current === map) {
        map.invalidateSize();
      }
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
