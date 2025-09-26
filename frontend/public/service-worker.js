/**
 * PC Queue System Service Worker
 * Handles push notifications for PC availability
 */

// Cache name for offline support
const CACHE_NAME = 'pc-queue-cache-v1';

// Listen for push events
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data ? event.data.text() : 'no data'}"`);

  let notificationData = {};
  
  try {
    // Try to parse the data as JSON
    const jsonData = event.data ? event.data.json() : {};
    notificationData = jsonData.notification || {};
    
    // If there's no title in the notification data, use a default
    if (!notificationData.title) {
      notificationData.title = '🔔 PC Available!';
    }
    
    // If there's no body in the notification data, use a default
    if (!notificationData.body) {
      notificationData.body = '⚡ URGENT: Your PC is ready! You have 2 minutes and 30 seconds to check in before losing your spot!';
    }
    
    // Ensure we have an icon
    if (!notificationData.icon) {
      notificationData.icon = '/favicon.ico';
    }
    
    // Add stronger vibration pattern for mobile devices
    if (!notificationData.vibrate) {
      notificationData.vibrate = [500, 200, 500, 200, 500];
    }
    
    // Make sure the notification requires interaction and will show even if another notification exists
    notificationData.requireInteraction = true;
    notificationData.renotify = true;
    notificationData.tag = 'pc-notification-' + Date.now(); // Unique tag to ensure multiple notifications
    notificationData.silent = false; // Ensure sound plays
    notificationData.priority = 'high';
    notificationData.timestamp = Date.now();
    notificationData.actions = [
      {
        action: 'open',
        title: '⚡ Go to Portal Now!'
      }
    ];
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    // If parsing fails, use default notification
    notificationData = {
      title: '🔔 PC Available!',
      body: '⚡ URGENT: Your PC is ready! You have 5 minutes to check in before losing your spot!',
      icon: '/favicon.ico',
      vibrate: [500, 200, 500, 200, 500],
      requireInteraction: true,
      renotify: true,
      tag: 'pc-notification-' + Date.now(),
      silent: false,
      priority: 'high',
      timestamp: Date.now(),
      actions: [
        {
          action: 'open',
          title: '⚡ Go to Portal Now!'
        }
      ]
    };
  }
  
  // Show the initial notification
  const showNotificationPromise = self.registration.showNotification(
    notificationData.title,
    notificationData
  );
  
  // Wait until the notification is shown
  event.waitUntil(showNotificationPromise);
  
  // Send follow-up notifications with increasing urgency
  const followUps = [
    {
      delay: 10000,
      title: '⚠️ PC Assignment Expiring!',
      body: 'Your PC assignment will expire soon! Please check in immediately!',
      vibrate: [800, 200, 800, 200, 800]
    },
    {
      delay: 30000,
      title: '🚨 FINAL WARNING!',
      body: 'Last chance to claim your PC! Check in now or lose your spot!',
      vibrate: [1000, 200, 1000, 200, 1000]
    }
  ];
  
  followUps.forEach((followUp, index) => {
    setTimeout(() => {
      console.log(`[Service Worker] Sending follow-up notification ${index + 1}`);
      self.registration.showNotification(
        followUp.title,
        {
          ...notificationData,
          title: followUp.title,
          body: followUp.body,
          vibrate: followUp.vibrate,
          tag: `pc-notification-followup-${index + 1}-${Date.now()}`,
          timestamp: Date.now()
        }
      );
    }, followUp.delay);
  });
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');
  
  // Close the notification
  event.notification.close();
  
  // Open the app and focus on it
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(function(clientList) {
        // If a window client is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('/student-portal') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window client is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/student-portal');
        }
      })
  );
});

// Install event - cache assets for offline use
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Install');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activate');
  self.clients.claim();
});