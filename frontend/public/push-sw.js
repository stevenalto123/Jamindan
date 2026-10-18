self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const bTitle = data.title || '🚨 EMERGENCY BROADCAST ALERT';
      const bBody = data.body || '🚨 CRITICAL ADVISORY: Tap to open platform and sound emergency alarm.';
      const fallbackUrl = `/?broadcast=1&title=${encodeURIComponent(bTitle)}&msg=${encodeURIComponent(bBody)}`;
      const targetUrl = data.url || fallbackUrl;

      const options = {
        body: bBody,
        icon: data.icon || '/logo.png',
        badge: '/logo.png',
        tag: 'jamindan-emergency-alert',
        renotify: true,
        requireInteraction: true,
        vibrate: [800, 250, 800, 250, 800, 250, 800, 250],
        data: {
          url: targetUrl
        },
        actions: [
          { action: 'open_siren', title: '🚨 OPEN & SOUND ALARM' }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(bTitle, options)
      );
    } catch (e) {
      // Fallback for plain text push
      const rawText = event.data.text();
      const fallbackUrl = `/?broadcast=1&title=${encodeURIComponent('🚨 Jamindan Emergency Alert')}&msg=${encodeURIComponent(rawText)}`;
      event.waitUntil(
        self.registration.showNotification('🚨 Jamindan Emergency Alert', {
          body: rawText,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'jamindan-emergency-alert',
          renotify: true,
          requireInteraction: true,
          vibrate: [800, 250, 800, 250, 800, 250, 800, 250],
          data: { url: fallbackUrl },
          actions: [
            { action: 'open_siren', title: '🚨 OPEN & SOUND ALARM' }
          ]
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/?broadcast=1';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(urlToOpen);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
