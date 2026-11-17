import { io } from 'socket.io-client';

export const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://jamindan.onrender.com';

/** Safely read persisted JWT token from sessionStorage or localStorage. */
export function getStoredToken() {
  try {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || null;
  } catch (e) {
    return null;
  }
}

/** Create a Socket.IO client connection with optional JWT credentials attached. */
export function createAuthSocket(options = {}) {
  const token = getStoredToken();
  return io(BACKEND_URL, {
    auth: token ? { token } : undefined,
    ...options
  });
}
