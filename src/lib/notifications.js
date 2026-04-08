import { Capacitor } from '@capacitor/core';

let LocalNotifications = null;

export async function initNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const mod = await import('@capacitor/local-notifications');
    LocalNotifications = mod.LocalNotifications;
    const { display } = await LocalNotifications.requestPermissions();
    if (display === 'granted') {
      console.log('Notifications permission granted');
    }
  } catch (e) {
    console.warn('LocalNotifications not available:', e);
  }
}

export async function sendNotification({ title, body, id }) {
  if (!LocalNotifications) return;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: id || Date.now(),
          schedule: { at: new Date(Date.now() + 100) },
          sound: 'default',
          smallIcon: 'ic_stat_icon',
        },
      ],
    });
  } catch (e) {
    console.warn('Failed to send notification:', e);
  }
}

export async function scheduleCleanupReminder() {
  if (!LocalNotifications) return;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: '📸 Time to clean up!',
          body: 'Your gallery could use some tidying. Swipe away photos you no longer need!',
          id: 9999,
          schedule: { at: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          sound: 'default',
          smallIcon: 'ic_stat_icon',
        },
      ],
    });
  } catch (e) {
    console.warn('Failed to schedule reminder:', e);
  }
}

export async function notifyCleanupComplete(deletedCount, freedSpace) {
  await sendNotification({
    title: '✨ Cleanup complete!',
    body: `Deleted ${deletedCount} photos and freed ${freedSpace} of space.`,
    id: 1001,
  });
}
