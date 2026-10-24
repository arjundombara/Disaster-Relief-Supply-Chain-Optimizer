
import React from 'react';
import ExcelJS from 'exceljs';
import {
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Warehouse,
  MapPin,
  TrendingUp,
  Package
} from 'lucide-react';

const reportDate = () => new Date().toISOString().slice(0, 10);

async function exportExcelReport({ title, filename, headers, rows, widths }) {
  if (!rows || rows.length === 0) {
    alert('There is no data available to export.');
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Disaster Relief Supply Chain Optimizer';
    workbook.created = new Date();
    workbook.subject = title;

    const sheet = workbook.addWorksheet('Report', {
      views: [{ state: 'frozen', ySplit: 1 }],
      pageSetup: {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9
      }
    });

    sheet.mergeCells(1, 1, 1, headers.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = {
      name: 'Arial',
      size: 16,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF12345A' }
    };
    titleCell.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };
    sheet.getRow(1).height = 32;

    sheet.mergeCells(2, 1, 2, headers.length);
    const dateCell = sheet.getCell(2, 1);
    dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
    dateCell.font = {
      name: 'Arial',
      size: 10,
      italic: true,
      color: { argb: 'FF475569' }
    };
    dateCell.alignment = { horizontal: 'right' };
    sheet.getRow(2).height = 22;

    const headerRow = sheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 32;

    headerRow.eachCell((cell) => {
      cell.font = {
        name: 'Arial',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 10
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1D4E89' }
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    rows.forEach((values, index) => {
      const row = sheet.getRow(index + 5);
      row.values = values;
      row.height = 24;

      row.eachCell((cell) => {
        cell.font = {
          name: 'Arial',
          size: 10,
          color: { argb: 'FF1E293B' }
        };
        cell.alignment = {
          vertical: 'middle',
          wrapText: true
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: index % 2 === 0 ? 'FFF1F5F9' : 'FFFFFFFF'
          }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    headers.forEach((header, index) => {
      sheet.getColumn(index + 1).width = widths?.[index] || 18;
    });

    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: headers.length }
    };

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = {
          ...cell.alignment,
          vertical: 'middle',
          wrapText: true
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel export failed:', error);
    alert('Could not create the Excel report. Please try again.');
  }
}

export default function ReportsView({
  stats,
  depots = [],
  distributionPoints = [],
  shipments = []
}) {
  const exportShipmentsExcel = () => {
    if (!shipments.length) {
      alert('No shipments available to export.');
      return;
    }

    const headers = [
      'Shipment Code',
      'Resource Type',
      'Source Depot',
      'Source Code',
      'Destination Zone',
      'Destination Code',
      'Allocated Qty',
      'Delivered Qty',
      'Status',
      'Recipient Name',
      'Created At',
      'Notes'
    ];

    const rows = shipments.map((s) => [
      s.shipmentCode || '',
      s.supplyType || '',
      s.sourceDepotName || '',
      s.sourceDepotCode || '',
      s.destinationPointName || '',
      s.destinationPointCode || '',
      s.allocatedQuantity ?? 0,
      s.deliveredQuantity ?? 0,
      s.status || '',
      s.recipientName || '',
      s.createdAt || '',
      s.deliveryNotes || ''
    ]);

    return exportExcelReport({
      title: 'Disaster Relief Shipment Report',
      filename: `disaster_relief_shipments_${reportDate()}.xlsx`,
      headers,
      rows,
      widths: [20, 18, 28, 18, 28, 20, 16, 16, 18, 24, 24, 40]
    });
  };

  const exportDepotStockExcel = () => {
    if (!depots.length) {
      alert('No depots to export.');
      return;
    }

    const headers = [
      'Depot Code',
      'Depot Name',
      'Address',
      'Max Capacity',
      'Food (kg)',
      'Water (L)',
      'Medicine (kits)',
      'Status'
    ];

    const rows = depots.map((d) => [
      d.code || '',
      d.name || '',
      d.address || '',
      d.maxCapacity ?? 0,
      d.inventories?.find((i) => i.supplyType === 'FOOD')?.availableQuantity ?? 0,
      d.inventories?.find((i) => i.supplyType === 'WATER')?.availableQuantity ?? 0,
      d.inventories?.find((i) => i.supplyType === 'MEDICINE')?.availableQuantity ?? 0,
      d.status || ''
    ]);

    return exportExcelReport({
      title: 'Disaster Relief Depot Inventory Report',
      filename: `disaster_relief_depots_${reportDate()}.xlsx`,
      headers,
      rows,
      widths: [20, 30, 38, 18, 16, 16, 20, 18]
    });
  };

  const exportDemandExcel = () => {
    if (!distributionPoints.length) {
      alert('No disaster zones to export.');
      return;
    }

    const headers = [
      'Zone Code',
      'Zone Name',
      'Address',
      'Severity',
      'Priority (1-5)',
      'Population Affected',
      'Food Demand (kg)',
      'Water Demand (L)',
      'Medicine Demand (kits)',
      'Total Delivered'
    ];

    const rows = distributionPoints.map((dp) => [
      dp.code || '',
      dp.name || '',
      dp.address || '',
      dp.severity || '',
      dp.priorityScore ?? 0,
      dp.affectedPopulation ?? 0,
      dp.foodDemand ?? 0,
      dp.waterDemand ?? 0,
      dp.medicineDemand ?? 0,
      dp.totalDelivered ?? 0
    ]);

    return exportExcelReport({
      title: 'Disaster Relief Disaster Zone Demand Report',
      filename: `disaster_relief_demands_${reportDate()}.xlsx`,
      headers,
      rows,
      widths: [18, 30, 38, 18, 18, 22, 20, 20, 24, 20]
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h2>Disaster Relief Audit &amp; Analytics Reports</h2>
          <p>
            Download professionally formatted Excel reports for shipments,
            depot inventory and disaster zone demand.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button
            className="btn btn-primary"
            onClick={exportShipmentsExcel}
          >
            <Download size={16} />
            <span>Export Shipments Excel</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={exportDepotStockExcel}
          >
            <FileSpreadsheet size={16} color="#38bdf8" />
            <span>Export Depot Stock Excel</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={exportDemandExcel}
          >
            <FileSpreadsheet size={16} color="#f87171" />
            <span>Export Demand Excel</span>
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card green">
          <div className="kpi-top">
            <span className="kpi-label">Total Relief Delivered</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div className="kpi-value">
            {stats?.totalDeliveredByType?.FOOD || 0}
            <span style={{ fontSize: '13px', color: '#94a3b8' }}> kg food</span>
          </div>
          <div className="kpi-subtext">
            <span>
              +{stats?.totalDeliveredByType?.WATER || 0}L water •
              +{stats?.totalDeliveredByType?.MEDICINE || 0} kits
            </span>
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-top">
            <span className="kpi-label">Unmet Need (Food)</span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <div className="kpi-value">
            {stats?.unmetDemandByType?.FOOD || 0}
            <span style={{ fontSize: '13px', color: '#94a3b8' }}> kg</span>
          </div>
          <div className="kpi-subtext">
            <span>
              Water unmet: {stats?.unmetDemandByType?.WATER || 0}L
            </span>
          </div>
        </div>

        <div className="kpi-card cyan">
          <div className="kpi-top">
            <span className="kpi-label">Total Food Demanded</span>
            <TrendingUp size={16} color="#38bdf8" />
          </div>
          <div className="kpi-value">
            {stats?.totalDemandByType?.FOOD || 0}
            <span style={{ fontSize: '13px', color: '#94a3b8' }}> kg</span>
          </div>
          <div className="kpi-subtext">
            Across {distributionPoints.length} disaster locations
          </div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-top">
            <span className="kpi-label">Active Dispatches</span>
            <Package size={16} color="#f59e0b" />
          </div>
          <div className="kpi-value">{shipments.length}</div>
          <div className="kpi-subtext">
            {shipments.filter((s) => s.status === 'DELIVERED').length}
            {' '}deliveries signed off
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <MapPin size={17} color="#ef4444" />
              Zone-by-Zone Demand Satisfaction &amp; Unmet Needs
            </h3>
            <p className="card-subtitle">
              Comprehensive status of disaster zones and relief aid shortfall
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Zone Code</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Population</th>
                <th>Food Demanded</th>
                <th>Water Demanded</th>
                <th>Medicine Demanded</th>
                <th>Delivered Total</th>
                <th>Fulfillment Rate</th>
              </tr>
            </thead>
            <tbody>
              {distributionPoints.map((dp) => {
                const totalReq =
                  (dp.foodDemand || 0) +
                  (dp.waterDemand || 0) +
                  (dp.medicineDemand || 0);
                const delivered = dp.totalDelivered || 0;
                const rate = totalReq > 0
                  ? ((delivered / totalReq) * 100).toFixed(0)
                  : 0;

                return (
                  <tr key={dp.id}>
                    <td
                      className="mono-cell"
                      style={{ fontWeight: 700, color: '#f87171' }}
                    >
                      {dp.code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{dp.name}</div>
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-dim)'
                      }}>
                        {dp.address || 'Disaster Sector'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        dp.severity === 'CRITICAL' ? 'badge-critical' :
                        dp.severity === 'HIGH' ? 'badge-high' :
                        'badge-medium'
                      }`}>
                        {dp.severity}
                      </span>
                    </td>
                    <td className="mono-cell">
                      {dp.affectedPopulation?.toLocaleString()}
                    </td>
                    <td className="mono-cell">{dp.foodDemand} kg</td>
                    <td className="mono-cell">{dp.waterDemand} L</td>
                    <td className="mono-cell">{dp.medicineDemand} kits</td>
                    <td
                      className="mono-cell"
                      style={{ fontWeight: 700, color: '#34d399' }}
                    >
                      {delivered} units
                    </td>
                    <td>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div
                          className="progress-bar-bg"
                          style={{ width: '80px' }}
                        >
                          <div
                            className={`progress-bar-fill ${
                              rate >= 80 ? 'fill-emerald' :
                              rate > 20 ? 'fill-amber' : 'fill-red'
                            }`}
                            style={{ width: `${Math.min(100, Number(rate))}%` }}
                          />
                        </div>
                        <span
                          className="mono-cell"
                          style={{ fontSize: '11.5px', fontWeight: 600 }}
                        >
                          {rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Warehouse size={17} color="#38bdf8" />
              Central Depots Stock Depletion &amp; Readiness
            </h3>
            <p className="card-subtitle">
              Current inventory vs storage capacity for remaining relief contingency
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Depot Code</th>
                <th>Depot Facility</th>
                <th>Storage Capacity</th>
                <th>Food Stock</th>
                <th>Water Stock</th>
                <th>Medicine Stock</th>
                <th>Readiness</th>
              </tr>
            </thead>
            <tbody>
              {depots.map((d) => {
                const food =
                  d.inventories?.find((i) => i.supplyType === 'FOOD')?.availableQuantity || 0;
                const water =
                  d.inventories?.find((i) => i.supplyType === 'WATER')?.availableQuantity || 0;
                const med =
                  d.inventories?.find((i) => i.supplyType === 'MEDICINE')?.availableQuantity || 0;
                const totalStock = food + water + med;

                return (
                  <tr key={d.id}>
                    <td
                      className="mono-cell"
                      style={{ fontWeight: 700, color: '#38bdf8' }}
                    >
                      {d.code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-dim)'
                      }}>
                        {d.address || 'Relief Hub'}
                      </div>
                    </td>
                    <td className="mono-cell">
                      {d.maxCapacity?.toLocaleString()} units
                    </td>
                    <td className="mono-cell">{food} kg</td>
                    <td className="mono-cell">{water} L</td>
                    <td className="mono-cell">{med} kits</td>
                    <td>
                      <span className={`badge ${
                        totalStock > 0 ? 'badge-success' : 'badge-critical'
                      }`}>
                        {totalStock > 0 ? 'OPERATIONAL' : 'DEPLETED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
