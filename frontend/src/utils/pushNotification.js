/**
 * Push Notification Utility Functions
 * Handles browser notifications for the PC Queue system
 */

// Check if push notifications are supported by the browser
export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Register the service worker for push notifications
export const registerServiceWorker = async () => {
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
};

// Request notification permission from the user
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    return { success: permission === 'granted', permission };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { success: false, error };
  }
};

// Convert a base64 string to a Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (studentId) => {
  try {
    // Check if notifications are supported
    if (!isPushNotificationSupported()) {
      return { success: false, message: 'Push notifications are not supported in this browser' };
    }

    // Request permission
    const permissionResult = await requestNotificationPermission();
    if (!permissionResult.success) {
      return { success: false, message: 'Notification permission denied' };
    }

    // SIMPLIFIED APPROACH: Skip push subscription entirely and use direct browser notifications
    // This works in all environments including non-HTTPS and when push service is unavailable
    window.useFallbackNotifications = true;
    
    // Test the notification system immediately
    try {
      new Notification('Notifications Enabled', {
        body: 'You will now receive notifications when a PC becomes available',
        icon: '/favicon.ico'
      });
    } catch (e) {
      console.warn('Test notification failed, but continuing:', e);
    }
    
    return { 
      success: true, 
      message: 'Using direct browser notifications',
      usingFallback: true
    };
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return { success: false, error };
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async () => {
  try {
    // Check if notifications are supported
    if (!isPushNotificationSupported()) {
      return { success: false, message: 'Push notifications are not supported in this browser' };
    }
    
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get current subscription
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return { success: true, message: 'No subscription found' };
    }
    
    // Unsubscribe from push notifications
    const unsubscribed = await subscription.unsubscribe();
    
    if (unsubscribed) {
      try {
        // Notify the server about unsubscription
        const response = await fetch(`${window.location.origin}/api/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            endpoint: subscription.endpoint
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          throw new Error('Failed to unsubscribe on server');
        }
      } catch (error) {
        console.error('Error during server unsubscription:', error);
        // Continue even if server unsubscription fails
        // The client-side unsubscription was successful
      }
    }
    
    return { success: unsubscribed };
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return { success: false, error };
  }
};

// Function to display a notification even if the tab is inactive
export const showNotification = async (title, options = {}) => {
  try {
    if (!isPushNotificationSupported()) {
      return { success: false, message: 'Notifications not supported' };
    }
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: 'Notification permission denied' };
    }
    
    // If we're using the fallback notification system (when push service is unavailable)
    if (window.useFallbackNotifications) {
      console.log('Using fallback notification system');
      // Create a standard browser notification
      new Notification(title, {
        body: options.body || '',
        icon: options.icon || '/favicon.ico',
        ...options
      });
      
      return { success: true };
    }
    
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body: options.body || '',
      icon: options.icon || '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      ...options
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error showing notification:', error);
    return { success: false, error };
  }
};