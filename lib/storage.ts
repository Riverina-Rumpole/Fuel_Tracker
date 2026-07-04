import AsyncStorage from '@react-native-async-storage/async-storage';

import { writeSpreadsheet } from '@/lib/spreadsheet';
import type { FuelFill, Vehicle } from '@/types/fuel';

export const MAX_VEHICLES = 4;

const VEHICLES_KEY = 'bowser-wonder:vehicles';
const ACTIVE_VEHICLE_KEY = 'bowser-wonder:active-vehicle-id';

function fillsKey(vehicleId: string): string {
  return `bowser-wonder:fuel-fills:${vehicleId}`;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const raw = await AsyncStorage.getItem(VEHICLES_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Vehicle[];
  } catch {
    return [];
  }
}

export async function addVehicle(vehicle: Vehicle): Promise<Vehicle[]> {
  const existing = await getVehicles();
  if (existing.length >= MAX_VEHICLES) {
    throw new Error(`You can add up to ${MAX_VEHICLES} vehicles.`);
  }
  if (existing.some((v) => v.registration.toLowerCase() === vehicle.registration.toLowerCase())) {
    throw new Error('A vehicle with that registration already exists.');
  }

  const updated = [...existing, vehicle];
  await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
  return updated;
}

export async function updateVehicle(vehicle: Vehicle): Promise<Vehicle[]> {
  const existing = await getVehicles();
  if (
    existing.some(
      (v) => v.id !== vehicle.id && v.registration.toLowerCase() === vehicle.registration.toLowerCase(),
    )
  ) {
    throw new Error('A vehicle with that registration already exists.');
  }

  const updated = existing.map((v) => (v.id === vehicle.id ? vehicle : v));
  await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteVehicle(id: string): Promise<Vehicle[]> {
  const existing = await getVehicles();
  const updated = existing.filter((v) => v.id !== id);
  await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
  await AsyncStorage.removeItem(fillsKey(id));

  const activeId = await getActiveVehicleId();
  if (activeId === id) {
    await AsyncStorage.setItem(ACTIVE_VEHICLE_KEY, updated[0]?.id ?? '');
  }

  return updated;
}

export async function getActiveVehicleId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_VEHICLE_KEY);
}

export async function setActiveVehicleId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_VEHICLE_KEY, id);
}

export async function getFuelFills(vehicleId: string): Promise<FuelFill[]> {
  const raw = await AsyncStorage.getItem(fillsKey(vehicleId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as FuelFill[];
    return parsed.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function addFuelFill(vehicle: Vehicle, fill: FuelFill): Promise<FuelFill[]> {
  const existing = await getFuelFills(vehicle.id);
  const updated = [...existing, fill];
  await AsyncStorage.setItem(fillsKey(vehicle.id), JSON.stringify(updated));
  await writeSpreadsheet(updated, vehicle);
  return updated;
}

export async function deleteFuelFill(vehicle: Vehicle, id: string): Promise<FuelFill[]> {
  const existing = await getFuelFills(vehicle.id);
  const updated = existing.filter((fill) => fill.id !== id);
  await AsyncStorage.setItem(fillsKey(vehicle.id), JSON.stringify(updated));
  await writeSpreadsheet(updated, vehicle);
  return updated;
}
