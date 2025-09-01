// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installed:', event);
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated:', event);
  // Claim clients to ensure the service worker controls all clients immediately
  event.waitUntil(clients.claim());
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  // Handle fallback notification requests
  if (event.data && event.data.type === 'SHOW_FALLBACK_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  if (event.data) {
    const data = event.data.json();
    
    // Enhanced notification options for better visibility when tab is inactive
    const options = {
      body: data.body || 'New notification',
      icon: data.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data || {},
      vibrate: [200, 100, 200], // Stronger vibration pattern
      tag: 'pc-available', // Tag to replace existing notifications
      renotify: true, // Notify user even if there's an existing notification with same tag
      requireInteraction: true, // Notification stays until user interacts with it
      actions: [
        {
          action: 'open',
          title: 'Open App'
        }
      ]
    };

    // Show notification with enhanced options
    event.waitUntil(
      self.registration.showNotification(data.title || 'PC Monitor Pro', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Handle notification action if present
  if (event.action === 'open') {
    console.log('User clicked "Open App" action');
  }

  // Focus or open the app with higher priority
  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(function(clientList) {
      // URL to navigate to - prioritize PC assignment page
      const url = event.notification.data.url || '/student-portal';
      
      // Try to find an existing window and focus it
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.focus();
          // If it's the right URL, we're done
          if (client.url.includes(url)) {
            return client;
          }
          // Otherwise, navigate to the correct URL
          return client.navigate(url);
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});