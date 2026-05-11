import { io, type Socket } from 'socket.io-client';

import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// ─── Customer socket (session-authenticated) ──────────────────────────────────

let _socket: AppSocket | null = null;

export function connectSocket(sessionToken: string): AppSocket {
  if (_socket?.connected) return _socket;

  _socket = io(SOCKET_URL, {
    auth: { session_token: sessionToken },
    transports: ['websocket', 'polling'],
  }) as AppSocket;

  _socket.on('connect', () => console.log('[socket] connected', _socket!.id));
  _socket.on('connect_error', (err) => console.error('[socket] connect error', err.message));

  return _socket;
}

export function getSocket(): AppSocket | null {
  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}

// ─── Anonymous table watcher socket (pre-session) ────────────────────────────

let _tableSocket: AppSocket | null = null;

export function connectTableSocket(qrCodeId: string): AppSocket {
  if (_tableSocket?.connected) return _tableSocket;

  _tableSocket = io(SOCKET_URL, {
    auth: { qr_code_id: qrCodeId },
    transports: ['websocket', 'polling'],
  }) as AppSocket;

  _tableSocket.on('connect', () => console.log('[table-socket] connected', _tableSocket!.id));
  _tableSocket.on('connect_error', (err) => console.error('[table-socket] connect error', err.message));

  return _tableSocket;
}

export function getTableSocket(): AppSocket | null {
  return _tableSocket;
}

export function disconnectTableSocket(): void {
  _tableSocket?.disconnect();
  _tableSocket = null;
}

// ─── Admin / restaurant socket (JWT-authenticated) ────────────────────────────

let _adminSocket: AppSocket | null = null;

export function connectAdminSocket(adminToken: string): AppSocket {
  if (_adminSocket?.connected) return _adminSocket;

  _adminSocket = io(SOCKET_URL, {
    auth: { admin_token: adminToken },
    transports: ['websocket', 'polling'],
  }) as AppSocket;

  _adminSocket.on('connect', () => console.log('[admin-socket] connected', _adminSocket!.id));
  _adminSocket.on('connect_error', (err) => console.error('[admin-socket] connect error', err.message));

  return _adminSocket;
}

export function getAdminSocket(): AppSocket | null {
  return _adminSocket;
}

export function disconnectAdminSocket(): void {
  _adminSocket?.disconnect();
  _adminSocket = null;
}
