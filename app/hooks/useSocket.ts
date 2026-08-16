import { default as io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";

let socket: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;
let currentUserId: string | null = null;

export const connectSocket = (
  userId: string | null
): Socket<DefaultEventsMap, DefaultEventsMap> | null => {
  if (userId) {
    currentUserId = userId;
  }

  if (!socket && userId) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      auth: { userId },
      query: { userId },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      if (currentUserId && socket) {
        socket.emit("join", currentUserId);
      }
    });

    socket.emit("join", userId);
  } else if (userId && socket) {
    socket.emit("join", userId);
  }

  return socket;
};

export const getSocket = (): Socket<
  DefaultEventsMap,
  DefaultEventsMap
> | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
};
