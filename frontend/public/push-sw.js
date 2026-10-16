self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || '🚨 CRITICAL ADVISORY: Tap to open platform and sound emergency alarm.',
        icon: data.icon || '/logo.png',
        badge: '/logo.png',
        tag: 'jamindan-emergency-alert',
        renotify: true,
        requireInteraction: true,
        vibrate: [800, 250, 800, 250, 800, 250, 800, 250],
        data: {
          url: '/?broadcast=1'
        },
        actions: [
          { action: 'open_siren', title: '🚨 OPEN & SOUND ALARM' }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(data.title || '🚨 EMERGENCY BROADCAST ALERT', options)
      );
    } catch (e) {
      // Fallback for plain text push
      event.waitUntil(
        self.registration.showNotification('🚨 Jamindan Emergency Alert', {
          body: event.data.text(),
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'jamindan-emergency-alert',
          renotify: true,
          requireInteraction: true,
          vibrate: [800, 250, 800, 250, 800, 250, 800, 250],
          data: { url: '/?broadcast=1' }
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : '/?broadcast=1';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
