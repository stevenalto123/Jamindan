import axios from 'axios';

const OFFLINE_SOS_KEY = 'jamindan_active_offline_sos';
const OFFLINE_INCIDENTS_KEY = 'jamindan_offline_incidents_queue';

/**
 * Save or overwrite the single active offline SOS ticket.
 * Guarantees that spam-tapping while offline NEVER creates multiple tickets.
 */
export const saveOfflineSos = ({ lat, lng, note, timestamp = new Date().toISOString() }) => {
  try {
    const existing = getOfflineSos();
    const count = existing ? (existing.tapCount || 1) + 1 : 1;
    
    const payload = {
      id: 'current_pending_sos',
      type: 'SOS Panic',
      description: '[SOS PANIC ALARM] Instantly triggered by resident via 3-second press while in dead signal zone. Auto-transmitted on reconnection.',
      location_lat: lat !== undefined ? lat : (existing?.location_lat ?? null),
      location_lng: lng !== undefined ? lng : (existing?.location_lng ?? null),
      note: note || existing?.note || null,
      timestamp,
      tapCount: count,
      queuedAt: existing?.queuedAt || timestamp
    };

    localStorage.setItem(OFFLINE_SOS_KEY, JSON.stringify(payload));
    return payload;
  } catch (err) {
    console.error('Failed to save offline SOS to storage:', err);
    return null;
  }
};

/**
 * Retrieve the active queued offline SOS ticket, if any.
 */
export const getOfflineSos = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_SOS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to read offline SOS from storage:', err);
    return null;
  }
};

/**
 * Clear the offline SOS ticket once verified and sent.
 */
export const clearOfflineSos = () => {
  try {
    localStorage.removeItem(OFFLINE_SOS_KEY);
  } catch (err) {
    console.error('Failed to clear offline SOS:', err);
  }
};

/**
 * Automatically sync queued offline SOS and incidents to the backend.
 * Returns { success: boolean, incidentId?: number, code?: string, count: number }
 */
export const syncOfflineQueue = async () => {
  if (!navigator.onLine) {
    return { synced: false, reason: 'offline' };
  }

  const queuedSos = getOfflineSos();
  if (!queuedSos) {
    return { synced: false, reason: 'empty' };
  }

  try {
    // Transmit the single deduplicated SOS ticket
    const res = await axios.post('/api/incidents', {
      type: queuedSos.type || 'SOS Panic',
      description: `${queuedSos.description} (Queued offline on device with ${queuedSos.tapCount || 1} tap confirmation)`,
      location_lat: queuedSos.location_lat,
      location_lng: queuedSos.location_lng
    });

    clearOfflineSos();

    return {
      synced: true,
      incidentId: res.data?.incidentId,
      code: res.data?.code,
      tapCount: queuedSos.tapCount || 1
    };
  } catch (err) {
    console.error('Auto-sync offline SOS error:', err);
    // If server responded with a client error (e.g. 400), clear to prevent infinite bad loops
    if (err.response && err.response.status >= 400 && err.response.status < 500) {
      clearOfflineSos();
    }
    return { synced: false, reason: err.message, status: err.response?.status };
  }
};
