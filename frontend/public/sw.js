self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'New emergency alert received.',
        icon: data.icon || '/jamindan-seal.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        requireInteraction: true,
        data: {
          url: data.url || '/'
        }
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Emergency Alert', options)
      );
    } catch (e) {
      // Fallback for plain text push
      event.waitUntil(
        self.registration.showNotification('Jamindan Emergency', {
          body: event.data.text(),
          icon: '/jamindan-seal.png',
          vibrate: [200, 100, 200]
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
