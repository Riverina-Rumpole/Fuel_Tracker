import * as Notifications from 'expo-notifications';

const FILL_REMINDER_DAYS = 30;
const EXPORT_REMINDER_DAYS = 30;
const SECONDS_PER_DAY = 86400;

function fillReminderId(vehicleId: string): string {
  return `fill-reminder-${vehicleId}`;
}

function exportReminderId(vehicleId: string): string {
  return `export-reminder-${vehicleId}`;
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function scheduleReminder(identifier: string, title: string, body: string, days: number): Promise<void> {
  // Cancel first so re-arming (e.g. after a new fill or export) resets the
  // clock instead of stacking a second reminder alongside the old one.
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

  if (!(await ensurePermission())) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: days * SECONDS_PER_DAY,
      repeats: false,
    },
  });
}

export async function scheduleFillReminder(vehicleId: string, registration: string): Promise<void> {
  await scheduleReminder(
    fillReminderId(vehicleId),
    'Time for a fill-up?',
    `You haven't logged a fill for ${registration} in ${FILL_REMINDER_DAYS} days.`,
    FILL_REMINDER_DAYS,
  );
}

export async function scheduleExportReminder(vehicleId: string, registration: string): Promise<void> {
  await scheduleReminder(
    exportReminderId(vehicleId),
    'Export your fuel log',
    `You haven't exported ${registration}'s fuel log spreadsheet in over a month.`,
    EXPORT_REMINDER_DAYS,
  );
}

export async function cancelRemindersForVehicle(vehicleId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(fillReminderId(vehicleId)).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(exportReminderId(vehicleId)).catch(() => {});
}
