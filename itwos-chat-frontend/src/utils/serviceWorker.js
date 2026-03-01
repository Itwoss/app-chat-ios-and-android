/**
 * Unregister any existing service workers
 * This fixes the "navigation preload request was cancelled" warning
 */
export const unregisterServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (let registration of registrations) {
        const unregistered = await registration.unregister();
        if (unregistered) {
          console.log('[ServiceWorker] Unregistered:', registration.scope);
        }
      }
      
      // Also clear any service worker cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[ServiceWorker] Cleared all caches');
      }
    } catch (error) {
      console.warn('[ServiceWorker] Error unregistering service workers:', error);
    }
  }
};

/**
 * Register a minimal service worker that properly handles navigation requests
 * This prevents the preload warning if you want to use service workers
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      // Only register in production if you want to use service workers
      // For now, we'll just unregister any existing ones
      await unregisterServiceWorkers();
    } catch (error) {
      console.warn('[ServiceWorker] Error registering service worker:', error);
    }
  }
};


