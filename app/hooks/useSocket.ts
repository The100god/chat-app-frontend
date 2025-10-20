import { default as io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";

let socket: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;
const backendUrl = process.env.NEXT_PUBLIC_API_URL;

export const useSocket = (
  userId: string | null
): Socket<DefaultEventsMap, DefaultEventsMap> | null => {
  if (!socket && userId) {
    socket = io(`${backendUrl}`);
    console.log("socketconnect", socket)
    socket.emit("join", userId);
  }
  if (userId && socket) {
    socket.emit("join", userId); // Join personal room for unseen updates
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
  }
};
