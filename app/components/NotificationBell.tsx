"use client"
import { useEffect, useState } from "react";
// import { Bell } from "lucide-react"; // Using Lucide Icons
import { getSocket, useSocket } from "../hooks/useSocket";
import { useAtom } from "jotai";
import { userIdAtom } from "../states/States";

const NotificationBell = () => {

const [requestCount, setRequestCount] = useState(0);
const [userId] = useAtom(userIdAtom);
  useEffect(() => {
    if (!userId) return;

    useSocket(userId); // 🔌 Join socket room

    const socket = getSocket();

    //Initial fetch from server via socket
    socket?.emit("getFriendRequests", { userId });

    // When server sends the full friend requests list
    const handleFriendRequestsList = (data: any[]) => {
      setRequestCount(data.length);
    };

    // When a new friend request is received
    const handleNewFriendRequest = ({ senderId }: { senderId: string }) => {
      setRequestCount((prev) => prev + 1);
    };

    // When user accepts or declines a request
    const handleRequestHandled = () => {
      setRequestCount((prev) => Math.max(prev - 1, 0));
    };

    socket?.on("friendRequestsList", handleFriendRequestsList);
    socket?.on("friendRequestReceived", handleNewFriendRequest);
    socket?.on("friendRequestAccepted", handleRequestHandled);
    socket?.on("friendRequestDenied", handleRequestHandled);

    return () => {
      socket?.off("friendRequestsList", handleFriendRequestsList);
      socket?.off("friendRequestReceived", handleNewFriendRequest);
      socket?.off("friendRequestAccepted", handleRequestHandled);
      socket?.off("friendRequestDenied", handleRequestHandled);
    };
  }, [userId]);

  return (
    <div className="relative">
      {/* <Bell size={24} className="cursor-pointer" /> */}
      {requestCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {requestCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
