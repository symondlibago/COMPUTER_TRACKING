import API_BASE_URL from '../components/pages/Config';

// Register service worker for push notifications
export const registerServiceWorker = async () => {
  try {
    console.log('Registering service worker...');
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
};

// Check if push notifications are supported by the browser
export const isPushNotificationSupported = () => {
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPushManager = 'PushManager' in window;
  const hasNotifications = 'Notification' in window;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSecureContext = window.isSecureContext;
  
  console.log('Push Notification Support Check:', {
    hasServiceWorker,
    hasPushManager,
    hasNotifications,
    isMobile,
    isSecureContext,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent
  });
  
  return hasServiceWorker && hasPushManager && hasNotifications && isSecureContext;
};

// Request permission for push notifications
export const requestNotificationPermission = async () => {
  if (!isPushNotificationSupported()) {
    return { success: false, message: 'Push notifications are not supported by your browser' };
  }

  try {
    const permission = await Notification.requestPermission();
    return { success: permission === 'granted', permission };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { success: false, error };
  }
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (studentId) => {
  if (!isPushNotificationSupported()) {
    return { success: false, message: 'Push notifications are not supported by your browser' };
  }

  try {
    // Check if permission is granted
    if (Notification.permission !== 'granted') {
      const permissionResult = await requestNotificationPermission();
      if (!permissionResult.success) {
        return permissionResult;
      }
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered successfully');

    // Get push subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BIN_2yc9u1XGvQYwY_FkjJcaLwQpqQGF1NpS1S1fI-WDrZfKZOVXGGfRLsD83CRFJH7NkrdT-sFkQdJGbMILZdf4cVQ')
    });

    // Send subscription to server
    const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        endpoint: subscription.endpoint,
        keys: {
          auth: arrayBufferToBase64(subscription.getKey('auth')),
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        },
      }),
    });

    const data = await response.json();
    return { success: data.success, message: data.message || 'Subscribed to notifications' };
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return { success: false, error: error.message };
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async () => {
  if (!isPushNotificationSupported()) {
    return { success: false, message: 'Push notifications are not supported by your browser' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return { success: true, message: 'Not subscribed to push notifications' };
    }

    // Send unsubscribe request to server
    const response = await fetch(`${API_BASE_URL}/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });

    // Unsubscribe locally
    await subscription.unsubscribe();

    const data = await response.json();
    return { success: data.success, message: data.message || 'Unsubscribed from notifications' };
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to convert URL base64 to Uint8Array
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

// Helper function to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer) => {
  const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
  return window.btoa(binary);
};