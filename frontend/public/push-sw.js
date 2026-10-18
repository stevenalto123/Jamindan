self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const bTitle = data.title || '🚨 EMERGENCY ALERT: EXTREME';
      const bBody = data.body || '🚨 CRITICAL ADVISORY: Tap to open platform and view alert.';
      const bSeverity = data.severity || 'extreme';
      const bArea = data.area || 'Municipality of Jamindan';
      const fallbackUrl = `/?broadcast=1&title=${encodeURIComponent(bTitle)}&msg=${encodeURIComponent(bBody)}&severity=${encodeURIComponent(bSeverity)}&area=${encodeURIComponent(bArea)}`;
      const targetUrl = data.url || fallbackUrl;

      const options = {
        body: bBody,
        icon: data.icon || '/logo.png',
        badge: '/logo.png',
        tag: 'jamindan-emergency-alert',
        channelId: 'emergency_alert_channel',
        channel_id: 'emergency_alert_channel',
        renotify: true,
        requireInteraction: true,
        vibrate: [4000, 1000, 2000, 1000, 2000, 1000],
        data: {
          url: targetUrl
        },
        actions: [
          { action: 'open_siren', title: '🚨 VIEW EMERGENCY ALERT' }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(bTitle, options)
      );
    } catch (e) {
      // Fallback for plain text push
      const rawText = event.data.text();
      const fallbackUrl = `/?broadcast=1&title=${encodeURIComponent('🚨 EMERGENCY ALERT: EXTREME')}&msg=${encodeURIComponent(rawText)}&severity=extreme&area=Municipality%20of%20Jamindan`;
      event.waitUntil(
        self.registration.showNotification('🚨 EMERGENCY ALERT: EXTREME', {
          body: rawText,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'jamindan-emergency-alert',
          channelId: 'emergency_alert_channel',
          channel_id: 'emergency_alert_channel',
          renotify: true,
          requireInteraction: true,
          vibrate: [4000, 1000, 2000, 1000, 2000, 1000],
          data: { url: fallbackUrl },
          actions: [
            { action: 'open_siren', title: '🚨 VIEW EMERGENCY ALERT' }
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
