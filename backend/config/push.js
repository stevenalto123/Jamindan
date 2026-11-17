const webpush = require('web-push');

const PUBLIC_VAPID_KEY = process.env.VAPID_PUBLIC_KEY || 'BJd5fK6r2z9Z39nPfgkV3kKcE9K3K7nvIAC7GFQdgZodVaVz-DRXaCVUoeb3VSjQxQCgJ3jPiDKm6cOI1PuU-oM';
const PRIVATE_VAPID_KEY = process.env.VAPID_PRIVATE_KEY || 'gi6UKdgvY7oL2TkiLWuDJPBtBkk0V4M--mXocHO7cF0';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@jamindan.gov.ph';

if (!process.env.VAPID_PRIVATE_KEY && process.env.NODE_ENV === 'production') {
  console.warn('[SECURITY WARNING] VAPID_PRIVATE_KEY env var is not set; using fallback VAPID key.');
}

try {
  if (PUBLIC_VAPID_KEY && PRIVATE_VAPID_KEY) {
    webpush.setVapidDetails(VAPID_EMAIL, PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);
  }
} catch (err) {
  console.error('Failed to initialize webpush:', err.message);
}

module.exports = { webpush, PUBLIC_VAPID_KEY };
