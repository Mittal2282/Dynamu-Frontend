import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// ─── Customer socket (session-authenticated) ──────────────────────────────────

let _socket = null;

export function connectSocket(sessionToken) {
  if (_socket?.connected) return _socket;

  _socket = io(SOCKET_URL, {
    auth: { session_token: sessionToken },
    transports: ['websocket', 'polling'],
  });

  _socket.on('connect', () => console.log('[socket] connected', _socket.id));
  _socket.on('connect_error', (err) => console.error('[socket] connect error', err.message));

  return _socket;
}

export function getSocket() {
  return _socket;
}

export function disconnectSocket() {
  _socket?.disconnect();
  _socket = null;
}

// ─── Admin / restaurant socket (JWT-authenticated) ────────────────────────────

let _adminSocket = null;

export function connectAdminSocket(adminToken) {
  if (_adminSocket?.connected) return _adminSocket;

  _adminSocket = io(SOCKET_URL, {
    auth: { admin_token: adminToken },
    transports: ['websocket', 'polling'],
  });

  _adminSocket.on('connect', () => console.log('[admin-socket] connected', _adminSocket.id));
  _adminSocket.on('connect_error', (err) => console.error('[admin-socket] connect error', err.message));

  return _adminSocket;
}

export function getAdminSocket() {
  return _adminSocket;
}

export function disconnectAdminSocket() {
  _adminSocket?.disconnect();
  _adminSocket = null;
}
