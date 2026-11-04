import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to signaling server:', socket.id);
      const userStr = localStorage.getItem('fixaround_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.id) {
            socket.emit('join_user', user.id);
          }
        } catch (e) {
          // ignore
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });
  }

  return socket;
}

export function registerSocketUser(userId) {
  const s = getSocket();
  if (s.connected && userId) {
    s.emit('join_user', userId);
  }
}

export function joinBookingRoom(bookingId) {
  const s = getSocket();
  if (bookingId) {
    s.emit('join_booking', bookingId);
  }
}

export default getSocket;
