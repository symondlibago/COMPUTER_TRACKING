// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installed:', event);
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated:', event);
});

self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification',
      icon: data.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data || {},
      vibrate: [100, 50, 100],
      actions: [
        {
          action: 'open',
          title: 'Open App'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'PC Monitor Pro', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then(function(clientList) {
      const url = event.notification.data.url || '/student-portal';
      
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === url && 'focus' in client)
          return client.focus();
      }
      
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});