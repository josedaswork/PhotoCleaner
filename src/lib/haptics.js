import { Capacitor } from '@capacitor/core';

let HapticsPlugin = null;

async function getHaptics() {
  if (HapticsPlugin) return HapticsPlugin;
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const mod = await import('@capacitor/haptics');
    HapticsPlugin = mod.Haptics;
    return HapticsPlugin;
  } catch {
    return null;
  }
}

export async function hapticLight() {
  const h = await getHaptics();
  if (h) h.impact({ style: 'LIGHT' });
}

export async function hapticMedium() {
  const h = await getHaptics();
  if (h) h.impact({ style: 'MEDIUM' });
}

export async function hapticHeavy() {
  const h = await getHaptics();
  if (h) h.impact({ style: 'HEAVY' });
}

export async function hapticSuccess() {
  const h = await getHaptics();
  if (h) h.notification({ type: 'SUCCESS' });
}

export async function hapticError() {
  const h = await getHaptics();
  if (h) h.notification({ type: 'ERROR' });
}
