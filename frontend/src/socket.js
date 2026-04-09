import { io } from 'socket.io-client';

let socket;

const getSocket = () => {
  if (!socket || socket.disconnected) {
    if (socket) {
      socket.removeAllListeners();
    }
    socket = io(import.meta.env.VITE_API_BE_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }
  return socket;
};

const setSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket = null;
  }
};

export default {
  getSocket,
  setSocket,
};