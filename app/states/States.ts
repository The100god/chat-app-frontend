"use client"
import { atom } from "jotai";
import { Friend } from "../pages/chatAreas/page";
import { Group } from "../components/GroupChatPage";


interface Message {
    _id?: string;
    chatId?: string;
    groupId?: string;
    sender?:
      | {
          _id: string;
          username: string;
          profilePic: string;
        }
      | string;
    receiver?: string | object;
    content?: string;
    media?: string[]; // not [string]
    createdAt?: string;
    isRead?: boolean;
    expiresAt?: string | null;
    seenBy?: {
      _id: string;
      username: string;
      profilePic: string;
    }[];
  }

  interface FloatingEmoji {
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

// const userId:string|null = localStorage.getItem("userId")
//     ? localStorage.getItem("userId")
//     : null;
  
export const userAtom = atom<User>({
  username: "User-X",
  email: "user@example.com",
  profilePic: "/user.jpg",
  about: "Hey there! I'm using ChatApp 💬",
});

export const responsiveDeviceAtom = atom<boolean>(true);

export const userIdAtom=atom<string|null>(null)
// const [userId] = useState<string|null>(() => localStorage.getItem("userId"));
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

export const selectedGroupAtom = atom<Group | null>(null);
export const groupNameAtom = atom<String>("");
export const groupAdminsAtom = atom<String[]>([]);
export const groupMembersAtom = atom<String[]>([]);
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