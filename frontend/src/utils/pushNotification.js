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

    // Register service worker if not already registered
    let registration;
    try {
      registration = await navigator.serviceWorker.ready;
      console.log('Service worker already registered:', registration);
    } catch (error) {
      console.log('Registering service worker...');
      registration = await registerServiceWorker();
    }
    
    // Store the student ID in the service worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STORE_STUDENT_ID',
        studentId: studentId
      });
      
      // Also store in localStorage as backup
      localStorage.setItem('studentId', studentId);
      
      // Trigger an immediate check
      navigator.serviceWorker.controller.postMessage({
        type: 'CHECK_NOW'
      });
    }

    // Get VAPID public key from server
    const vapidResponse = await fetch('/api/push/vapid-public-key', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!vapidResponse.ok) {
      console.error('Failed to get VAPID public key:', await vapidResponse.text());
      // Fall back to direct notifications if VAPID key retrieval fails
      window.useFallbackNotifications = true;
      
      // Test the notification system immediately
       try {
         await registration.showNotification('Notifications Enabled (Fallback Mode)', {
           body: 'You will receive notifications when a PC becomes available',
           icon: '/favicon.ico'
         });
       } catch (error) {
         console.error('Error showing fallback notification:', error);
       }
      
      return { 
        success: true, 
        message: 'Using direct browser notifications (fallback mode)',
        usingFallback: true 
      };
    }

    const { vapidPublicKey } = await vapidResponse.json();
    console.log('Got VAPID public key:', vapidPublicKey.substring(0, 10) + '...');

    // Convert VAPID key to the format expected by the browser
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    // Get existing subscription or create a new one
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Using existing push subscription');
    } else {
      console.log('Creating new push subscription...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      console.log('Created new subscription');
    }

    // Send the subscription to the server
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Authorization': `Bearer ${token}` 
      },
      credentials: 'include',
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, 
            new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode.apply(null, 
            new Uint8Array(subscription.getKey('auth'))))
        },
        student_id: studentId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      throw new Error('Failed to subscribe on server');
    }

    // Test the notification system immediately
    try {
      // Use the service worker registration to show the notification
      await registration.showNotification('Push Notifications Enabled', {
        body: 'You will now receive notifications when a PC becomes available',
        icon: '/favicon.ico'
      });
    } catch (error) {
      console.error('Error showing test notification:', error);
    }
    
    window.useFallbackNotifications = false;
    
    return { 
      success: true, 
      message: 'Successfully subscribed to push notifications',
      usingFallback: false
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
    
    // Always use the service worker registration to show notifications
    const registration = await navigator.serviceWorker.ready;
    
    // Add default options
    const notificationOptions = {
      body: options.body || '',
      icon: options.icon || '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100, 100, 100, 100],
      tag: options.tag || 'pc-notification-' + Date.now(),
      requireInteraction: true,
      renotify: true,
      silent: false,
      data: {
        url: options.url || window.location.href,
        ...options.data
      },
      ...options
    };
    
    // Log notification attempt
    console.log('Showing notification:', title, notificationOptions);
    
    // Show the notification using the service worker
    await registration.showNotification(title, notificationOptions);
    
    // Send a message to the service worker to check for PC availability
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CHECK_NOW'
      });
    }
    
    // Send a follow-up notification after a short delay to ensure delivery
    setTimeout(async () => {
      await registration.showNotification(title, {
        ...notificationOptions,
        tag: 'pc-notification-followup-' + Date.now()
      });
      console.log('Follow-up notification sent');
    }, 2000);
    
    return { success: true };
  } catch (error) {
    console.error('Error showing notification:', error);
    return { success: false, error };
  }
};