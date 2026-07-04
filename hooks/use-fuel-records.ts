import { useCallback, useEffect, useState } from 'react';

import { attachMetrics } from '@/lib/metrics';
import { scheduleFillReminder } from '@/lib/notifications';
import { addFuelFill, deleteFuelFill, getFuelFills } from '@/lib/storage';
import type { FuelFill, FuelFillWithMetrics, Vehicle } from '@/types/fuel';

export function useFuelRecords(vehicle: Vehicle | null) {
  const [records, setRecords] = useState<FuelFillWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!vehicle) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fills = await getFuelFills(vehicle.id);
      setRecords(attachMetrics(fills));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fuel records.');
    } finally {
      setLoading(false);
    }
  }, [vehicle]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveFill = useCallback(
    async (fill: FuelFill) => {
      if (!vehicle) {
        throw new Error('Add a vehicle before logging a fill.');
      }
      const updated = await addFuelFill(vehicle, fill);
      setRecords(attachMetrics(updated));
      // Re-arm the "haven't logged a fill in a while" reminder from now,
      // rather than from whenever the vehicle was added.
      scheduleFillReminder(vehicle.id, vehicle.registration).catch(() => {});
    },
    [vehicle],
  );

  const removeFill = useCallback(
    async (id: string) => {
      if (!vehicle) {
        return;
      }
      const updated = await deleteFuelFill(vehicle, id);
      setRecords(attachMetrics(updated));
    },
    [vehicle],
  );

  return {
    records,
    loading,
    error,
    refresh,
    saveFill,
    removeFill,
  };
}
