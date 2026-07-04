import { File, Paths } from 'expo-file-system';
import * as XLSX from 'xlsx';

import { formatDisplayDate } from '@/lib/metrics';
import type { FuelFill, Vehicle } from '@/types/fuel';

function sanitizeFilenamePart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9-]+/g, '_') || 'vehicle';
}

export function spreadsheetFilenameFor(vehicle: Vehicle): string {
  return `fuel_log_${sanitizeFilenamePart(vehicle.registration)}.xlsx`;
}

const HEADERS = [
  'Date',
  'Price/L ($)',
  'Litres',
  'Total ($)',
  'Odometer (km)',
  'Km since last fill',
  'km/L',
  'L/100km',
  'Cost/km ($)',
];

function getSpreadsheetFile(vehicle: Vehicle): File {
  return new File(Paths.document, spreadsheetFilenameFor(vehicle));
}

function buildWorksheet(records: FuelFill[]): XLSX.WorkSheet {
  const rows: (string | number)[][] = [HEADERS];

  for (const record of records) {
    rows.push([
      formatDisplayDate(record.date),
      record.pricePerLitre,
      record.litres,
      record.totalPrice,
      record.odometer,
    ]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  for (let index = 0; index < records.length; index += 1) {
    const rowNumber = index + 2;

    worksheet[`F${rowNumber}`] = {
      t: 'n',
      f: `IF(ROW()=2,"",E${rowNumber}-E${rowNumber - 1})`,
    };
    worksheet[`G${rowNumber}`] = {
      t: 'n',
      f: `IF(F${rowNumber}=0,"",F${rowNumber}/C${rowNumber})`,
    };
    worksheet[`H${rowNumber}`] = {
      t: 'n',
      f: `IF(F${rowNumber}=0,"",(C${rowNumber}/F${rowNumber})*100)`,
    };
    worksheet[`I${rowNumber}`] = {
      t: 'n',
      f: `IF(F${rowNumber}=0,"",D${rowNumber}/F${rowNumber})`,
    };
  }

  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
  ];

  return worksheet;
}

export async function writeSpreadsheet(records: FuelFill[], vehicle: Vehicle): Promise<string> {
  const workbook = XLSX.utils.book_new();
  const worksheet = buildWorksheet(records);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fuel Log');

  const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
  const file = getSpreadsheetFile(vehicle);
  file.write(base64, { encoding: 'base64' });

  return file.uri;
}

export function getSpreadsheetUri(vehicle: Vehicle): string | null {
  const file = getSpreadsheetFile(vehicle);
  return file.exists ? file.uri : null;
}
