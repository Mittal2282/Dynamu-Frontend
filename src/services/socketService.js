import { io } from 'socket.io-client';

let _socket = null;

export function connectSocket(sessionToken) {
  if (_socket?.connected) return _socket;

  const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  _socket = io(url, {
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
