"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import ScaleTN from "./ScaleTN";
import {
  findFriendAtom,
  findFriendWithChatAtom,
  friendsAtom,
  responsiveDeviceAtom,
  selectedFriendAtom,
  selectedGroupAtom,
  userIdAtom,
} from "../states/States";
import { useAtom } from "jotai";

import { MessageSquare } from "lucide-react";

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

const FriendsList: React.FC<FriendsListProps> = ({ loading }) => {
  const [selectedFriend, setSelectedFriend] = useAtom(selectedFriendAtom);
  const [friends, setFriends] = useAtom(friendsAtom);
  const [, setSelectedGroup] = useAtom(selectedGroupAtom);
  const [userId] = useAtom(userIdAtom);
  const [, setShowLeft] = useAtom(responsiveDeviceAtom);

  const [, setFindFriend] = useAtom(findFriendAtom);
  const [, setFindFriendWithChat] = useAtom(findFriendWithChatAtom);
  const safeFriends = Array.isArray(friends) ? friends : [];

  useEffect(() => {
    if (!loading && friends.length === 0) {
      setFindFriend(true);
      setFindFriendWithChat(false);
    }
  }, [loading, friends, setFindFriend, setFindFriendWithChat]);

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowLeft(false);

    if (userId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/message/mark-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ senderId: friend.friendId, receiverId: userId }),
      });
    }

    setFriends((prev) =>
      prev.map((f) =>
        f.friendId === friend.friendId ? { ...f, unreadMessagesCount: 0 } : f
      )
    );
    setSelectedGroup(null);
  };

  return (
    <div className="bg-[var(--card)] text-[var(--foreground)] h-full w-full rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col shadow-xs">
      {/* Header bar for conversation list */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)]">
        <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Chats</h2>
        {/* <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-semibold">
          {safeFriends.length} contacts
        </span> */}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
        {loading ? (
          <ScaleTN rows={5} />
        ) : safeFriends.length < 1 ? (
          <div className="text-center py-12 px-4 text-[var(--foreground)]/70">
            <MessageSquare className="w-8 h-8 opacity-40 mx-auto mb-2 text-[var(--accent)]" />
            <p className="font-semibold text-sm">No chats started yet</p>
            <p className="text-xs opacity-60 mt-1">Redirecting to Find Friends...</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]/40">
            {safeFriends && safeFriends.map((friend) => {
              const isSelected = selectedFriend?.friendId === friend?.friendId;
              const hasUnread = (friend?.unreadMessagesCount || 0) > 0;

              return (
                <li
                  key={friend?.friendId}
                  onClick={() => handleSelectFriend(friend)}
                  className={`flex items-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 relative ${isSelected
                      ? "bg-[var(--accent)]/15 border-l-4 border-l-[var(--accent)] text-[var(--foreground)]"
                      : "hover:bg-[var(--muted)]"
                    }`}
                >
                  {/* WhatsApp Profile Avatar */}
                  <div className="relative mr-3.5 flex-shrink-0">
                    <Image
                      src={friend?.profilePic || "/default-profile-pic.jpg"}
                      alt={friend?.username || "Friend profile picture"}
                      className="w-12 h-12 rounded-full border border-[var(--border)] object-cover shadow-2xs"
                      width={48}
                      height={48}
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[var(--card)] rounded-full"></span>
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p
                        className={`text-sm truncate ${hasUnread || isSelected
                            ? "font-bold text-[var(--foreground)]"
                            : "font-medium text-[var(--foreground)]"
                          }`}
                      >
                        {friend.username}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--foreground)]/60">
                      <p className="truncate text-xs opacity-75 max-w-[180px]">
                        {hasUnread ? (
                          <span className="text-[var(--accent)] font-semibold">New message</span>
                        ) : (
                          "Tap to chat"
                        )}
                      </p>

                      {hasUnread && (
                        <span className="bg-[var(--accent)] text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-2xs ml-2 flex-shrink-0">
                          {friend?.unreadMessagesCount}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FriendsList;
