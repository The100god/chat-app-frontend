"use client";
import React from "react";
import {
  friendsAtom,
  selectedFriendAtom,
  selectedGroupAtom,
  userIdAtom,
} from "../states/States";
import { useAtom } from "jotai";
import Image from "next/image";

interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
  unreadMessagesCount: number;
}

interface FriendsListProps {
  // friends: Friend[];
  loading: boolean;
}

const backendUrl = process.env.NEXT_PUBLIC_API_URL;


const FriendsList: React.FC<FriendsListProps> = ({ loading }) => {
  const [, setSelectedFriend] = useAtom(selectedFriendAtom);
  const [friends, setFriends] = useAtom(friendsAtom);
  const [, setSelectedGroup] = useAtom(selectedGroupAtom);
  const [userId] = useAtom(userIdAtom);

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);

    // Sync to backend and mark messages as read
    // const userId = localStorage.getItem("userId");
    console.log("ids");
    if (userId) {
      fetch(`${backendUrl}/api/message/mark-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ senderId: friend.friendId, receiverId: userId }),
      });
    }

    // Update global state to reset unread count
    setFriends((prev) =>
      prev.map((f) =>
        f.friendId === friend.friendId ? { ...f, unreadMessagesCount: 0 } : f
      )
    );
    setSelectedGroup(null);
  };

  return (
    <div className="p-4 bg-[var(--background)] text-[var(--foreground)] h-full w-full rounded-md overflow-y-auto">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-3">
          {friends && friends.map((friend) => (
            <li
              key={friend?.friendId}
              onClick={() => handleSelectFriend(friend)}
              className="flex items-center bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]/15 p-2 rounded-xl cursor-pointer transition duration-200 border border-[var(--foreground)] hover:border-[var(--accent)]"
            >
              <Image
                src={friend?.profilePic || "/default-profile-pic.jpg"}
                alt={friend?.username}
                className="w-12 h-12 rounded-full border-2 border-[var(--accent)] mr-4 object-cover"
              />
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    friend?.unreadMessagesCount > 0
                      ? "font-bold text-[var(--foreground)]"
                      : "font-medium text-[var(--foreground)]"
                  }`}
                >
                  {friend.username}
                </p>
                <div className="flex items-center text-xs mt-1">
                  {friend?.unreadMessagesCount > 0 ? (
                    <span className="bg-green-600 text-white px-2 py-0.5 rounded-full">
                      {friend?.unreadMessagesCount} unread
                    </span>
                  ) : (
                    <span className="text-[var(--foreground)]/50">No unread messages</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendsList;
