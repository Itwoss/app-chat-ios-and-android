/**
 * Push subscription helpers (used by NotificationPermissionBanner and UserSettings test).
 * Push API requires applicationServerKey as Uint8Array; plain Base64 string fails silently.
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Ensure this device has a push subscription saved on the server.
 * Registers SW if needed, subscribes (or reuses existing), saves to backend.
 * @param {string} publicKey - VAPID public key (base64)
 * @param {(body: { endpoint: string, keys: { p256dh: string, auth: string } }) => Promise} saveSubscription - API mutation
 * @returns {Promise<boolean>} - true if subscription is now saved
 */
export async function ensurePushSubscription(publicKey, saveSubscription) {
  if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await new Promise((resolve) => {
        if (reg.installing) reg.installing.addEventListener('statechange', () => { if (reg.waiting || reg.active) resolve(); });
        else resolve();
      });
    }
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    const json = sub.toJSON();
    await saveSubscription({ endpoint: json.endpoint, keys: json.keys }).unwrap();
    return true;
  } catch (e) {
    console.warn('[pushUtils] ensurePushSubscription failed:', e);
    return false;
  }
}

/**
 * Unsubscribe (if any) then subscribe again and save. Use when subscription may be expired (410/404).
 * Gets a fresh subscription so backend can send push again.
 */
export async function resubscribePushSubscription(publicKey, saveSubscription) {
  if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
    }
    return await ensurePushSubscription(publicKey, saveSubscription);
  } catch (e) {
    console.warn('[pushUtils] resubscribePushSubscription failed:', e);
    return false;
  }
}
