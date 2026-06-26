import { io } from "socket.io-client";
import { ACCESS_TOKEN_UPDATED } from "./services/AuthService";

let socket = null;
let lastToken = null;

const clearSocket = () => {
  if (socket) {
    socket.disconnect();
  }
  socket = null;
  lastToken = null;
};

if (typeof window !== "undefined") {
  window.addEventListener(ACCESS_TOKEN_UPDATED, clearSocket);
}

const getSocket = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return null;
  }
  if (socket && lastToken !== token) {
    clearSocket();
  }
  if (!socket) {
    socket = io(import.meta.env.VITE_API_BE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    lastToken = token;
  }
  return socket;
};

const setSocket = () => {
  clearSocket();
};

export default {
  getSocket,
  setSocket,
};
