import * as Print from 'expo-print';

import { formatCurrency, formatDisplayDate, formatNumber } from '@/lib/metrics';
import type { FuelFillWithMetrics, Vehicle } from '@/types/fuel';

function buildRowsHtml(records: FuelFillWithMetrics[]): string {
  return records
    .map(
      (record) => `
        <tr>
          <td>${formatDisplayDate(record.date)}</td>
          <td>${formatCurrency(record.pricePerLitre, 3)}</td>
          <td>${formatNumber(record.litres)}</td>
          <td>${formatCurrency(record.totalPrice)}</td>
          <td>${formatNumber(record.odometer, 0)}</td>
          <td>${formatNumber(record.metrics.kmSinceLastFill, 1)}</td>
          <td>${formatNumber(record.metrics.kmPerLitre)}</td>
          <td>${formatNumber(record.metrics.litresPer100Km)}</td>
          <td>${formatCurrency(record.metrics.costPerKm, 3)}</td>
        </tr>`,
    )
    .join('');
}

function buildHtml(records: FuelFillWithMetrics[], vehicle: Vehicle): string {
  const title = vehicle.nickname
    ? `${vehicle.registration} (${vehicle.nickname})`
    : vehicle.registration;

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0B1220; padding: 16px; }
          h1 { font-size: 18px; margin: 0 0 4px; }
          p { font-size: 12px; color: #5A6478; margin: 0 0 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #D6DCE5; padding: 6px 8px; text-align: right; }
          th:first-child, td:first-child { text-align: left; }
          th { background: #F1F4F9; }
        </style>
      </head>
      <body>
        <h1>Fuel log — ${title}</h1>
        <p>${records.length} fill${records.length === 1 ? '' : 's'} · generated ${formatDisplayDate(new Date().toISOString().slice(0, 10))}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Price/L</th>
              <th>Litres</th>
              <th>Total</th>
              <th>Odometer</th>
              <th>Km since last</th>
              <th>km/L</th>
              <th>L/100km</th>
              <th>Cost/km</th>
            </tr>
          </thead>
          <tbody>${buildRowsHtml(records)}</tbody>
        </table>
      </body>
    </html>
  `;
}

export async function printFuelLog(records: FuelFillWithMetrics[], vehicle: Vehicle): Promise<void> {
  await Print.printAsync({ html: buildHtml(records, vehicle) });
}
