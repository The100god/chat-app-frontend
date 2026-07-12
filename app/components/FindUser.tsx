"use client";
// FindUser.tsx (Search and Send Friend Request)
import React, { useEffect, useState } from "react";
import { getSocket, useSocket } from "../hooks/useSocket";
import { userIdAtom } from "../states/States";
import { useAtom } from "jotai";

interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
  unreadMessagesCount: number;
}

let debounceTimeout: NodeJS.Timeout;
// Function to search users by username
const searchUsers = async (username: string, userId: string | null) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/users/search?username=${username}&userId=${userId}`
  );
  return await response.json();
};

const FindUser = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const [userId] = useAtom(userIdAtom);
  useEffect(() => {
    if (userId) {
      useSocket(userId); // ✅ Connect and emit 'join'
    }
  }, [userId]);

  // Fetch already-sent requests on mount so we can pre-mark them
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit("getSentFriendRequests", { userId });

    const handleSentRequests = (sentIds: string[]) => {
      setRequestedIds(new Set(sentIds));
    };

    socket.on("sentFriendRequestsList", handleSentRequests);

    return () => {
      socket.off("sentFriendRequestsList", handleSentRequests);
    };
  }, [userId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(async () => {
      const foundUsers = await searchUsers(searchQuery.trim(), userId);
      // console.log("foundUsers", foundUsers);
      setUsers(Array.isArray(foundUsers) ? foundUsers : []);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const handleSendRequest = async (receiverId: string) => {
    const socket = getSocket(); // ✅ Get connected socket
    if (!socket || !userId) return;

    socket.emit("sendFriendRequest", {
      senderId: userId,
      receiverId,
    });

    // Immediately mark as requested in UI
    setRequestedIds((prev) => new Set(prev).add(receiverId));
    setMessage("Friend request sent!");
  };

  return (
    <div className="flex flex-col justify-start items-start w-full h-full">
      <h1 className="text-3xl font-medium text-[var(--accent)] mb-2">
        Looking For Friends?
      </h1>

      <div className="flex flex-row justify-start items-center w-full p-2 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username"
          className="border-b-2 border-[var(--accent)] outline-none bg-[var(--card)] h-[40px] rounded-lg p-1 pl-3 text-[var(--foreground)] w-[80%]"
        />
        {/* <button onClick={handleSearch}>Search</button> */}
      </div>

      {message && <p className="text-green-400 p-2">{message}</p>}

      <div className="flex flex-col justify-start items-start gap-4 w-full px-2 py-6">
        {Array.isArray(users) && users?.map((user: any) => {
          const isRequested = requestedIds.has(user._id);
          return (
            <div
              key={user?._id}
              className="flex flex-row justify-between items-center bg-[var(--card)] hover:bg-[var(--accent)]/15 text-[var(--foreground)] border border-[var(--foreground)] hover:border-[var(--accent)] rounded-lg w-[80%] px-3 py-4"
            >
              <div className="flex flex-row justify-start items-center gap-3">
                <img
                  src={user?.profilePic}
                  alt="pic"
                  className="w-8 h-8 rounded-full border-2 border-[var(--accent)]"
                />
                <p>{user?.username}</p>
              </div>
              <button
                className={`flex justify-center items-center w-fit h-fit px-3 py-1 rounded-lg text-sm font-medium transition ${isRequested
                    ? "bg-yellow-600/80 text-white cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-500 cursor-pointer text-white"
                  }`}
                onClick={() => !isRequested && handleSendRequest(user._id)}
                disabled={isRequested}
              >
                {isRequested ? "Requested ✓" : "Make Friend"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FindUser;
