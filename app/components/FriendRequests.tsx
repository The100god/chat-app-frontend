/* eslint "@typescript-eslint/no-explicit-any": "error" */
"use client";
import { useState, useEffect } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAtom } from "jotai";
import { userIdAtom } from "../states/States";
import Image from "next/image";

// Function to fetch pending friend requests
// const fetchFriendRequests = async (userId: string) => {
//   const response = await fetch(`http://localhost:5000/api/friends/friend-requests/${userId}`);
//   return await response.json();
// };

// Function to respond to a friend request (Accept/Reject)
// const respondToFriendRequest = async (userId: string, senderId: string, action: "accept" | "declined") => {
//   const response = await fetch("http://localhost:5000/api/friends/respond-request", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ userId, senderId, action }),
//   });

//   return await response.json();
// };

interface FriendRequest {
  _id: string;        // senderId
  username: string;
  profilePic: string;
}

const FriendRequests = () => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userId] = useAtom(userIdAtom);
  const socket = useSocket(userId);

  // useEffect(() => {
  //   if (userId) {
  //     fetchFriendRequests(userId).then((data) => {
  //       setRequests(data);
  //       setLoading(false);
  //     });

  //     socket?.on("friendRequestReceived", (newRequest)=>{
  //       console.log("New Friend Request:", newRequest);
  //       setRequests((prev) => [...prev, newRequest]); // Update UI instantly
  //     })
  //     return () => {
  //       socket?.off("friendRequestReceived"); // Cleanup when unmounting
  //     };
  //   }
  // }, [userId, socket]);

  useEffect(() => {
    if (!userId || !socket) return;

    // 👋 Join the server via socket
    // socket.emit("join", userId);

    // 🔄 Fetch initial friend requests from DB via socket
    socket.emit("getFriendRequests", { userId });

    // 📥 Set initial list of friend requests
    const handleFriendRequestsList = (data: FriendRequest[]) => {
      setRequests(data);
      setLoading(false);
    };

    // 📥 Real-time new friend request received
    const handleNewFriendRequest = ({
      senderId,
      username,
      profilePic,
    }: {
      senderId: string;
      username: string;
      profilePic: string;
    }) => {
      // Avoid duplicates if already in list
      setRequests((prev) => {
        if (prev.some((req) => req._id === senderId)) return prev;
        return [...prev, { _id: senderId, username, profilePic }];
      });
    };

    // ✅ Friend Request Accepted
    const handleAccepted = ({ receiverId }: { receiverId: string }) => {
      console.log("✅ Your friend request was accepted by", receiverId);
    };

    // ❌ Friend Request Denied
    const handleDenied = ({ receiverId }: { receiverId: string }) => {
      console.log("❌ Your friend request was denied by", receiverId);
    };

    socket.on("friendRequestsList", handleFriendRequestsList);
    socket.on("friendRequestReceived", handleNewFriendRequest);
    socket.on("friendRequestAccepted", handleAccepted);
    socket.on("friendRequestDenied", handleDenied);

    return () => {
      socket.off("friendRequestsList", handleFriendRequestsList);
      socket.off("friendRequestReceived", handleNewFriendRequest);
      socket.off("friendRequestAccepted", handleAccepted);
      socket.off("friendRequestDenied", handleDenied);
    };
  }, [userId, socket]);

  // console.log("requests", requests);
  const handleResponse = async (
    senderId: string,
    action: "accept" | "declined"
  ) => {
    // if (userId) {
    //   await respondToFriendRequest(userId, senderId, action);
    //   setRequests((prev) => prev.filter((req) => req._id !== senderId));
    // }

    if (userId && socket) {
      socket.emit("handleFriendRequest", {
        senderId,
        receiverId: userId,
        status: action === "accept" ? "accepted" : "declined",
      });

      // Remove the handled request from UI
      setRequests((prev) => prev.filter((req) => req._id !== senderId));
    }
  };

  return (
    <div className="p-4 bg-[var(--background)] text-[var(--foreground) shadow-md rounded-md w-[90%]">
      <h2 className="text-lg font-semibold mb-3">Friend Requests</h2>
      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No new friend requests.</p>
      ) : (
        requests?.map((req) => (
          <div
            key={req?._id}
            className="flex justify-between items-center bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]/15 border border-[var(--foreground)] hover:border-[var(--accent)] cursor-pointer transition duration-200 p-2 rounded-md mb-2"
          >
            <div className="flex flex-row gap-2 items-center">
              <span className="flex border border-[var(--accent)] rounded-full w-8 h-8 p-[1px] justify-center items-center">
                <Image
                  className="flex rounded-full border-2 border-[var(--accent)] w-full h-full"
                  src={req?.profilePic}
                  alt="pic"
                />
              </span>
              <p>{req?.username}</p>
            </div>
            <div>
              <button
                className="bg-[var(--accent)] cursor-pointer text-[var(--foreground)] px-2 py-1 rounded-md mr-2"
                onClick={() => handleResponse(req?._id, "accept")}
              >
                Accept
              </button>
              <button
                className="bg-red-500 cursor-pointer text-white px-2 py-1 rounded-md"
                onClick={() => handleResponse(req?._id, "declined")}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FriendRequests;
