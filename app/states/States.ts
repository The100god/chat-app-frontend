"use client";
import { atom } from "jotai";
import { Group } from "../components/GroupChatPage";

export interface Message {
  _id?: string;
  chatId?: string;
  groupId?: string;
  uploading?: boolean;
  sender?:
    | {
        _id: string;
        username: string;
        profilePic: string;
      }
    | string;
  receiver?: string | object;
  content?: string;
  media?: string[];
  createdAt?: string;
  isRead?: boolean;
  expiresAt?: string | null;
  seenBy?: {
    _id: string;
    username: string;
    profilePic: string;
  }[];
}

export interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

export interface User {
  username: string;
  email: string;
  profilePic: string;
  about: string;
}

export interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
  unreadMessagesCount: number;
}

export const userAtom = atom<User>({
  username: "User-X",
  email: "user@example.com",
  profilePic: "/user.jpg",
  about: "Hey there! I'm using Chugli 💬",
});

export const responsiveDeviceAtom = atom<boolean>(true);
export const updateAvailableAtom = atom<boolean>(false);
export const userIdAtom = atom<string | null>(null);
export const messageAtom = atom<Message[]>([]);
export const loadingMessageAtom = atom<boolean>(true);

export const findFriendAtom = atom<boolean>(false);
export const findFriendWithChatAtom = atom<boolean>(true);
export const friendsRequestsAtom = atom<boolean>(false);
export const allFriendsAtom = atom<boolean>(false);
export const groupChatOpenAtom = atom<boolean>(false);
export const friendsCountsAtom = atom<number>(0);
export const selectedFriendAtom = atom<Friend | null>(null);
export const friendsAtom = atom<Friend[]>([]);

export const unreadCountAtom = atom<number>((get) => {
  const friends = get(friendsAtom);
  if (!Array.isArray(friends)) return 0;
  return friends.reduce(
    (total, friend) => total + (friend?.unreadMessagesCount || 0),
    0
  );
});

export const selectedGroupAtom = atom<Group | null>(null);
export const groupNameAtom = atom<string>("");
export const groupAdminsAtom = atom<string[]>([]);
export const groupMembersAtom = atom<string[]>([]);
export const groupProfileAtom = atom<string>("");
export const isNewGroupWindowAtom = atom<boolean>(false);

// Disappearing messages — tracks the selected timer for the next message
// Values in hours: 1, 4, 8, 12, 24 (default 24h)
export const disappearDurationAtom = atom<number>(24);

const emojiSet = [
  "💬", "✨", "🔥", "💫", "💖", "🌈",
  "🌸", "🦋", "🌟", "💭", "🌈", "🌸",
  "🦋", "🌟", "💭",
];

// Create an atom that initializes once with random emojis
export const floatingEmojisAtom = atom<FloatingEmoji[]>(() => {
  return Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    emoji: emojiSet[Math.floor(Math.random() * emojiSet.length)],
    x: Math.random() * 100, // random x%
    y: Math.random() * 100, // random y%
    size: Math.random() * 2 + 1.1, // random scale
  }));
});