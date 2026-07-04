import { useCallback, useEffect, useState } from 'react';

import { cancelRemindersForVehicle, scheduleExportReminder, scheduleFillReminder } from '@/lib/notifications';
import {
  MAX_VEHICLES,
  addVehicle as addVehicleToStorage,
  deleteVehicle as deleteVehicleFromStorage,
  getActiveVehicleId,
  getVehicles,
  setActiveVehicleId,
  updateVehicle as updateVehicleInStorage,
} from '@/lib/storage';
import type { Vehicle } from '@/types/fuel';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicleId, setActiveVehicleIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedVehicles, storedActiveId] = await Promise.all([
        getVehicles(),
        getActiveVehicleId(),
      ]);
      setVehicles(loadedVehicles);

      const activeStillExists = loadedVehicles.some((v) => v.id === storedActiveId);
      const resolvedActiveId = activeStillExists ? storedActiveId : loadedVehicles[0]?.id ?? null;
      setActiveVehicleIdState(resolvedActiveId || null);
      if (resolvedActiveId && resolvedActiveId !== storedActiveId) {
        await setActiveVehicleId(resolvedActiveId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addVehicle = useCallback(async (registration: string, nickname: string) => {
    const vehicle: Vehicle = {
      id: `${Date.now()}`,
      registration: registration.trim().toUpperCase(),
      nickname: nickname.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    const updated = await addVehicleToStorage(vehicle);
    setVehicles(updated);
    await setActiveVehicleId(vehicle.id);
    setActiveVehicleIdState(vehicle.id);
    // Start both reminder clocks immediately, so a vehicle that never gets a
    // fill or an export still eventually gets a nudge.
    scheduleFillReminder(vehicle.id, vehicle.registration).catch(() => {});
    scheduleExportReminder(vehicle.id, vehicle.registration).catch(() => {});
    return vehicle;
  }, []);

  const editVehicle = useCallback(async (vehicle: Vehicle) => {
    const updated = await updateVehicleInStorage(vehicle);
    setVehicles(updated);
  }, []);

  const removeVehicle = useCallback(async (id: string) => {
    const updated = await deleteVehicleFromStorage(id);
    setVehicles(updated);
    setActiveVehicleIdState((current) => (current === id ? updated[0]?.id ?? null : current));
    cancelRemindersForVehicle(id).catch(() => {});
  }, []);

  const selectVehicle = useCallback(async (id: string) => {
    await setActiveVehicleId(id);
    setActiveVehicleIdState(id);
  }, []);

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) ?? null;

  return {
    vehicles,
    activeVehicle,
    loading,
    error,
    refresh,
    addVehicle,
    editVehicle,
    removeVehicle,
    selectVehicle,
    canAddMore: vehicles.length < MAX_VEHICLES,
  };
}
