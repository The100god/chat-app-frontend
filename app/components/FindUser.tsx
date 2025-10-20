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
const backendUrl = process.env.NEXT_PUBLIC_API_URL;

// Function to search users by username
const searchUsers = async (username: string, userId: string | null) => {
  const response = await fetch(
    `${backendUrl}/api/users/search?username=${username}&userId=${userId}`
  );
  return await response.json();
};

// Function to send a friend request
// const sendFriendRequest = async (socket:any, senderId: string|null, receiverId: string) => {
//   if (!senderId) return;
//   // Emit real-time event to receiver
//   socket.emit("sendFriendRequest", { senderId, receiverId });
//   const response = await fetch("http://localhost:5000/api/friends/send-request", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ senderId, receiverId }),
//   });

//   const data = await response.json();
//   return data.message;
// };

const FindUser = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  const [userId] = useAtom(userIdAtom);
  useEffect(() => {
    if (userId) {
      useSocket(userId); // ✅ Connect and emit 'join'
    }
  }, [userId]);

  // const handleSearch = async () => {
  //   if (searchQuery.trim()) {
  //     const foundUsers = await searchUsers(searchQuery);
  //     setUsers(foundUsers);
  //   }
  // };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(async () => {
      const foundUsers = await searchUsers(searchQuery.trim(), userId);
      // console.log("foundUsers", foundUsers);
      setUsers(foundUsers);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const handleSendRequest = async (receiverId: string) => {
    // const result = await sendFriendRequest(socket, userId, receiverId);
    // setMessage(result);
    const socket = getSocket(); // ✅ Get connected socket
    if (!socket || !userId) return;

    socket.emit("sendFriendRequest", {
      senderId: userId,
      receiverId,
    });

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
        {users?.map((user: any) => (
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
              className="flex justify-center items-center w-fit h-fit bg-green-600 hover:bg-green-500 px-3 py-1 cursor-pointer rounded-lg text-white text-sm font-medium"
              onClick={() => handleSendRequest(user._id)}
            >
              Make Friend
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FindUser;
