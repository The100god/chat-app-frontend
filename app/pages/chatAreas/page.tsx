"use client";
import React, { useEffect, useRef, useState } from "react";
import { connectSocket } from "../../hooks/useSocket";
import { useAtom } from "jotai";
import {
  floatingEmojisAtom,
  loadingMessageAtom,
  messageAtom,
  selectedFriendAtom,
  selectedGroupAtom,
  userIdAtom,
  disappearDurationAtom,
  responsiveDeviceAtom,
} from "../../states/States";
import Image from "next/image";
import MediaViewerModal from "../../components/MediaViewerModal";
import EmojiPicker from "../../components/EmojiPicker";
import VoiceRecorder from "../../components/VoiceRecorder";
import GroupInfoModal from "../../components/GroupInfoModal";
import { showToast } from "../../components/Toast";
import { X, Timer, ChevronDown, Plus, SendHorizontal, Loader2, ArrowLeft, Settings, Trash2 } from "lucide-react";
import ScaleTN from "../../components/ScaleTN";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
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
  media?: string[]; // not [string]
  createdAt?: string;
  isRead?: boolean;
  expiresAt?: string | null;
  seenBy?: {
    _id: string;
    username: string;
    profilePic: string;
  }[];
  deletedFor?: (string | { _id: string })[];
}

// Disappearing message timer options (hours)
const DISAPPEAR_OPTIONS = [
  // { label: "Off", value: 0 },
  { label: "1 hour", value: 1 },
  { label: "4 hours", value: 4 },
  { label: "8 hours", value: 8 },
  { label: "12 hours", value: 12 },
  { label: "24 hours", value: 24 },
];

// Helper: format remaining time for countdown
function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Helper: format message timestamp (e.g., 10:42 AM)
function formatMessageTime(createdAt?: string): string {
  if (!createdAt) return "";
  try {
    const d = new Date(createdAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "";
  }
}

export interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
  unreadMessagesCount: number;
}

export default function ChatArea() {
  // const userId = localStorage.getItem("userId")
  //   ? localStorage.getItem("userId")
  //   : null;
  const [userId] = useAtom(userIdAtom);
  const socket = connectSocket(userId);
  // const hasMounted = useRef(false);
  const shouldScroll = useRef(true);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [modalMedia, setModalMedia] = useState<string[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);

  useEffect(() => {
    if (showEmoji) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [showEmoji]);
  const [selectedFriend, setSelectedFriend] = useAtom(selectedFriendAtom);
  const [messages, setMessages] = useAtom(messageAtom);
  const [messageInput, setMessageInput] = useState<string>("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingFriend, setTypingFriend] = useState<string | null>(null);
  let typingTimeout: NodeJS.Timeout;
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    const urls = mediaFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mediaFiles]);
  const [loadingMessages, setLoadingMessages] = useAtom(loadingMessageAtom);
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [floatingEmojis] = useAtom(floatingEmojisAtom);
  //group
  const [selectedGroup, setSelectedGroup] = useAtom(selectedGroupAtom);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [disappearDuration, setDisappearDuration] = useAtom(disappearDurationAtom);
  const [, setCountdownTick] = useState(0); // forces re-render for countdown
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const actionsDropdownRef = useRef<HTMLDivElement | null>(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showDisappearSubmenu, setShowDisappearSubmenu] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement | null>(null);
  const [, setShowLeft] = useAtom(responsiveDeviceAtom);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });
  const username =
    selectedFriend?.username ||
    selectedGroup?.groupName ||
    "Select a friend to chat";

  const colors = [
    "text-pink-400",
    "text-amber-400",
    "text-emerald-400",
    "text-cyan-400",
    "text-sky-400",
    "text-indigo-400",
    "text-violet-400",
    "text-rose-400",
    "text-fuchsia-400",
    "text-lime-400",
  ];
  // Join chat and fetch messages
  useEffect(() => {
    // console.log("selectedGroup", selectedGroup);
    if ((!selectedFriend && !selectedGroup) || !userId) return;

    setLoadingMessages(true);
    const fetchChat = async () => {
      shouldScroll.current = true; // Only scroll on opening chat
      setHasAutoScrolled(false); // allow auto-scroll for new friend
      try {
        if (selectedFriend) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([userId, selectedFriend?.friendId]),
          });

          const data = await res.json();
          setChatId(data._id);
          // console.log("data", data._id);

          if (socket && data._id) {
            socket.emit("join", data._id);
            if (selectedFriend?.friendId) {
              socket.emit("messagesRead", {
                chatId: data._id,
                readerId: userId,
                senderId: selectedFriend.friendId,
              });
              socket.emit("mark_messages_read", {
                senderId: selectedFriend.friendId,
                receiverId: userId,
              });
            }
          }

          const messagesRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/message/${data._id}?userId=${userId}`
          );
          const messagesData = await messagesRes.json();
          if (Array.isArray(messagesData)) {
            setMessages(messagesData);
            setLoadingMessages(false);
          } else {
            setMessages([]); // or handle the error gracefully
            setLoadingMessages(false);
            console.error("Fetched messages is not an array", messagesData);
          }

          // Mark messages as read in DB
          if (selectedFriend?.friendId) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/message/mark-read`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                senderId: selectedFriend.friendId,
                receiverId: userId,
              }),
            }).catch(() => { });
          }
        } else if (selectedGroup) {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/groups/group-message/${selectedGroup._id}?userId=${userId}`
          );
          const messagesData = await res.json();
          setChatId(selectedGroup._id);

          if (socket && selectedGroup) {
            socket.emit("groupMessagesRead", {
              groupId: selectedGroup._id,
              readerId: userId,
            });
          }

          if (Array.isArray(messagesData)) {
            setMessages(messagesData);
            setLoadingMessages(false);
          } else {
            setMessages([]); // or handle the error gracefully
            setLoadingMessages(false);
            console.error(
              "Fetched group messages is not an array",
              messagesData
            );
          }
        }
      } catch (err) {
        console.error("Error fetching chat or messages:", err);
      }
    };

    fetchChat();
  }, [selectedFriend, selectedGroup, socket, userId, setLoadingMessages, setChatId, setMessages]);

  useEffect(() => {
    if (socket && selectedGroup?._id) {
      socket.emit("joinGroup", selectedGroup._id);
      // console.log("🔗 Joined group socket room:", selectedGroup._id);
    }
  }, [selectedGroup, socket]);

  useEffect(() => {
    if (!socket || !selectedGroup) return;

    const handleGroupUpdated = (updatedGroup: any) => {
      if (updatedGroup._id === selectedGroup._id) {
        setSelectedGroup(updatedGroup);
      }
    };

    const handleGroupDeleted = ({ groupId }: { groupId: string }) => {
      if (groupId === selectedGroup._id) {
        setSelectedGroup(null);
        setShowGroupInfo(false);
        showToast("This group has been deleted by an admin.", "info");
      }
    };

    const handleRemovedFromGroup = ({ groupId }: { groupId: string }) => {
      if (groupId === selectedGroup._id) {
        setSelectedGroup(null);
        setShowGroupInfo(false);
        showToast("You have been removed from this group.", "info");
      }
    };

    socket.on("groupUpdated", handleGroupUpdated);
    socket.on("groupDeleted", handleGroupDeleted);
    socket.on("removedFromGroup", handleRemovedFromGroup);

    return () => {
      socket.off("groupUpdated", handleGroupUpdated);
      socket.off("groupDeleted", handleGroupDeleted);
      socket.off("removedFromGroup", handleRemovedFromGroup);
    };
  }, [socket, selectedGroup, setSelectedGroup]);

  // Receive new messages via Socket.IO
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = (message: Message) => {
      if (message.chatId === chatId) {
        const isDeletedForUser =
          message.deletedFor &&
          Array.isArray(message.deletedFor) &&
          message.deletedFor.some(
            (id: any) =>
              (typeof id === "string" ? id : id?._id?.toString() || id?.toString()) === userId
          );
        if (isDeletedForUser) return;

        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m._id === message._id);
          if (alreadyExists) return prev;

          const localIndex = prev.findIndex(
            (m) =>
              m._id?.startsWith("local-") &&
              ((typeof m.sender === "string" && m.sender === userId) ||
                (typeof m.sender === "object" && m.sender?._id === userId)) &&
              (m.content === message.content ||
                (!m.content && !message.content) ||
                (m.content === "" && message.content === "let's Talk!")) &&
              m.media?.length === message.media?.length
          );

          if (localIndex !== -1) {
            const updated = [...prev];
            updated[localIndex] = message;
            return updated;
          }

          return [...prev, message];
        });
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, chatId, userId, setMessages]);

  useEffect(() => {
    if (!socket || !selectedGroup) return;

    const handleGroupMessage = (message: Message) => {
      // console.log("handleGroupMessage", message);
      const msgGroupId =
        typeof message.groupId === "object"
          ? (message.groupId as any)?._id?.toString() || (message.groupId as any)?.toString()
          : message.groupId?.toString();
      const currentGroupId = selectedGroup?._id?.toString();

      if (msgGroupId && currentGroupId && msgGroupId === currentGroupId) {
        const isDeletedForUser =
          message.deletedFor &&
          Array.isArray(message.deletedFor) &&
          message.deletedFor.some(
            (id: any) =>
              (typeof id === "string" ? id : id?._id?.toString() || id?.toString()) === userId
          );
        if (isDeletedForUser) return;

        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m._id === message._id);
          if (alreadyExists) return prev;

          const localIndex = prev.findIndex(
            (m) =>
              m._id?.startsWith("local-") &&
              ((typeof m.sender === "string" && m.sender === userId) ||
                (typeof m.sender === "object" && m.sender?._id === userId)) &&
              (m.content === message.content ||
                (!m.content && !message.content) ||
                (m.content === "" && message.content === "let's Talk!")) &&
              m.media?.length === message.media?.length
          );

          if (localIndex !== -1) {
            const updated = [...prev];
            updated[localIndex] = message;
            return updated;
          }

          return [...prev, message];
        });

        // Automatically mark as read since user is actively in this group
        if (socket && userId) {
          socket.emit("groupMessagesRead", {
            groupId: currentGroupId,
            readerId: userId,
          });
        }
      }
    };

    socket.on("newGroupMessage", handleGroupMessage);

    return () => {
      socket.off("newGroupMessage", handleGroupMessage);
    };
  }, [socket, selectedGroup, userId, setMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    if (socket && selectedFriend && !isTyping) {
      setIsTyping(true);
      socket.emit("typing", {
        receiverId: selectedFriend.friendId,
        userId: userId,
      });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      if (socket && selectedFriend) {
        socket.emit("stopTyping", {
          receiverId: selectedFriend.friendId,
          userId: userId,
        });
      }
      setIsTyping(false);
    }, 1500); // 1.5 seconds after stop
  };

  const sendMessage = async () => {
    if (
      !chatId ||
      !userId ||
      (!selectedFriend && !selectedGroup) ||
      !socket ||
      (!messageInput.trim() && mediaFiles.length === 0)
    )
      return;

    const textToSend = messageInput.trim();
    const mediaFilesToSend = [...mediaFiles];

    // Clear input field and media previews instantly!
    setMessageInput("");
    setMediaFiles([]);
    setPreviewVisible(false);
    setShowEmoji(false);

    const localId = `local-${Date.now()}`;
    if (mediaFilesToSend.length > 0) {
      const optimisticMessage: Message = {
        _id: localId,
        chatId: chatId || undefined,
        groupId: selectedGroup?._id || undefined,
        sender: {
          _id: userId,
          username: "Me",
          profilePic: "",
        },
        content: textToSend,
        media: mediaFilesToSend.map((file) => URL.createObjectURL(file) + "#" + file.type),
        createdAt: new Date().toISOString(),
        isRead: false,
        seenBy: [],
        uploading: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
    }

    // Convert media files to base64
    const convertToBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

    try {
      const mediaBase64 = await Promise.all(
        mediaFilesToSend.map((file) => convertToBase64(file))
      );
      // console.log("media", mediaBase64);
      // Include disappearDuration for 1-1 chats (0 = permanent)
      const newMessage = {
        chatId,
        senderId: userId,
        receiverId: selectedFriend?.friendId,
        content: textToSend,
        media: mediaBase64,
        isRead: false,
        disappearDuration: selectedFriend ? disappearDuration : 0,
      };

      // console.log("selectedGroup._id", selectedGroup?._id);
      const endpoint = selectedGroup
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/groups/send-group-message`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/message`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          selectedGroup
            ? {
              groupId: selectedGroup._id,
              senderId: userId,
              content: textToSend,
              media: mediaBase64,
            }
            : newMessage
        ),
      });

      const savedMessage = await res.json();

      // console.log("saveMessage", savedMessage);

      setLoadingMessages(false);

      if (mediaFilesToSend.length > 0) {
        setMessages((prev) => {
          const alreadyHasSaved = prev.some((m) => m._id === savedMessage._id);
          if (alreadyHasSaved) {
            return prev.filter((m) => m._id !== localId);
          }
          return prev.map((m) => (m._id === localId ? savedMessage : m));
        });
      } else {
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m._id === savedMessage._id);
          if (!alreadyExists) {
            return [...prev, savedMessage];
          }
          return prev;
        });
      }

      // console.log("socketSelectedGroup", selectedGroup);
      socket.emit(
        selectedGroup ? "sendGroupMessage" : "sendMessage",
        selectedGroup
          ? {
            groupId: selectedGroup._id,
            senderId: userId,
            content: savedMessage.content,
            media: savedMessage.media,
          }
          : {
            chatId: savedMessage.chatId,
            senderId: userId,
            receiverId: selectedFriend?.friendId || (typeof savedMessage.receiver === "string" ? savedMessage.receiver : savedMessage.receiver?._id),
            media: savedMessage.media,
            content: savedMessage.content,
          }
      );
    } catch (err) {
      console.error("Error sending message:", err);
      if (mediaFilesToSend.length > 0) {
        setMessages((prev) => prev.filter((m) => m._id !== localId));
      }
    }
  };



  const handleDeleteChat = () => {
    if (!chatId || !userId) return;
    setConfirmModal({
      isOpen: true,
      title: "Delete Chat",
      message: "Are you sure you want to delete this chat? This will clear the chat history for you. The other user will still see the messages.",
      onConfirm: async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/message/clear-chat`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId, userId }),
            }
          );

          if (res.ok) {
            setMessages([]);
            setSelectedFriend(null);
            setSelectedGroup(null);
            setChatId(null);
            setShowLeft(true);
            showToast("Chat cleared successfully.", "success");
          } else {
            showToast("Failed to delete chat.", "error");
          }
        } catch (err) {
          console.error("Error deleting chat:", err);
          showToast("Error deleting chat.", "error");
        }
      }
    });
  };

  const handleRemoveFriend = () => {
    if (!selectedFriend || !userId) return;
    setConfirmModal({
      isOpen: true,
      title: "Remove Friend",
      message: `Are you sure you want to remove ${selectedFriend.username} from your friends? This will also remove you from their friends list.`,
      onConfirm: async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/friends/remove-friend`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, friendId: selectedFriend.friendId }),
            }
          );

          if (res.ok) {
            setSelectedFriend(null);
            setSelectedGroup(null);
            setChatId(null);
            setShowLeft(true);
            showToast("Friend removed successfully.", "success");
          } else {
            const data = await res.json();
            showToast(data.message || "Failed to remove friend.", "error");
          }
        } catch (err) {
          console.error("Error removing friend:", err);
          showToast("Error removing friend.", "error");
        }
      }
    });
  };

  const handleDeleteMessage = (messageId?: string, isGroupChat?: boolean) => {
    if (!messageId || !userId) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete Message",
      message: "Are you sure you want to delete this message?",
      onConfirm: async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/message/delete-message`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageId, userId, isGroup: isGroupChat }),
            }
          );

          const data = await res.json();
          if (res.ok) {
            setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
            showToast(data.message || "Message deleted.", "success");
          } else {
            showToast(data.message || "Failed to delete message.", "error");
          }
        } catch (err) {
          console.error("Error deleting message:", err);
          showToast("Error deleting message.", "error");
        }
      }
    });
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, {
          type: "audio/webm",
        });

        setMediaFiles((prev) => [...prev, file]);
        setPreviewVisible(true);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      showToast("🎙️ Recording started... Release to preview!", "success");
    } catch (err) {
      console.error("Error starting voice recording:", err);
      showToast("Could not access microphone.", "error");
      setIsRecordingVoice(false);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
  };

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isRecordingVoice) return;

    // Start timer for 3 seconds (3000ms)
    longPressTimerRef.current = setTimeout(() => {
      startVoiceRecording();
    }, 3000);
  };

  const handlePressEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;

      if (!isRecordingVoice) {
        // Short click -> send regular message
        sendMessage();
      } else {
        // Release hold -> stop and send
        stopVoiceRecording();
      }
    } else if (isRecordingVoice) {
      stopVoiceRecording();
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessagesReadAck = ({
      chatId: ackChatId,
      readerId,
      updatedMessages,
    }: {
      chatId: string;
      readerId: string;
      updatedMessages?: Message[];
    }) => {
      if (readerId === userId) return;

      setMessages((prevMessages) => {
        if (!prevMessages) return [];
        return prevMessages
          .filter((msg) => {
            if (!msg.deletedFor || !Array.isArray(msg.deletedFor)) return true;
            return !msg.deletedFor.some(
              (id: any) =>
                (typeof id === "string" ? id : id?._id?.toString() || id?.toString()) === userId
            );
          })
          .map((prevMsg) => {
            const updated = updatedMessages?.find((m) => m._id === prevMsg._id);
            if (updated) {
              return {
                ...prevMsg,
                isRead: updated.isRead,
                expiresAt: updated.expiresAt,
              };
            }
            const isSenderCurrentUser =
              (typeof prevMsg?.sender === "string" && prevMsg?.sender === userId) ||
              (typeof prevMsg?.sender === "object" && prevMsg?.sender?._id === userId);
            return isSenderCurrentUser && prevMsg?.chatId === ackChatId
              ? { ...prevMsg, isRead: true }
              : prevMsg;
          });
      });
    };

    socket.on("messagesReadAck", handleMessagesReadAck);

    return () => {
      socket.off("messagesReadAck", handleMessagesReadAck);
    };
  }, [socket, userId, setMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleSeenUpdate = ({
      groupId,
      messages: updatedMessages,
    }: {
      groupId: string;
      messages: Message[];
    }) => {
      const currentGroupId = selectedGroup?._id?.toString();
      const incomingGroupId = groupId?.toString();
      if (currentGroupId && incomingGroupId && incomingGroupId === currentGroupId) {
        setMessages((prevMessages) => {
          if (!prevMessages) return [];
          return prevMessages
            .filter((msg) => {
              if (!msg.deletedFor || !Array.isArray(msg.deletedFor)) return true;
              return !msg.deletedFor.some(
                (id: any) =>
                  (typeof id === "string" ? id : id?._id?.toString() || id?.toString()) === userId
              );
            })
            .map((prevMsg) => {
              const updated = updatedMessages?.find((m) => m._id === prevMsg._id);
              if (updated) {
                return {
                  ...prevMsg,
                  seenBy: updated.seenBy,
                  expiresAt: updated.expiresAt,
                };
              }
              return prevMsg;
            });
        });
      }
    };

    socket.on("groupSeenUpdate", handleSeenUpdate);

    return () => {
      socket.off("groupSeenUpdate", handleSeenUpdate);
    };
  }, [socket, selectedGroup, userId, setMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    };

    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [socket, setMessages]);

  useEffect(() => {
    if (!socket || !selectedFriend) return;

    const handleFriendRemoved = ({ friendId: removedId }: { friendId: string }) => {
      if (removedId === selectedFriend.friendId) {
        setSelectedFriend(null);
        setSelectedGroup(null);
        setChatId(null);
        setShowLeft(true);
        showToast("You are no longer friends with this user.", "info");
      }
    };

    socket.on("friendRemoved", handleFriendRemoved);

    return () => {
      socket.off("friendRemoved", handleFriendRemoved);
    };
  }, [socket, selectedFriend, setSelectedFriend, setSelectedGroup, setChatId, setShowLeft]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
      const container = chatContainerRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior });
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior });
          }
        }, 50);
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior });
          }
        }, 150);
      }
    };

    if (shouldScroll.current) {
      scrollToBottom("auto");
      shouldScroll.current = false;
      setHasAutoScrolled(false);
      return;
    }

    const container = chatContainerRef.current;
    if (!container) {
      scrollToBottom("smooth");
      return;
    }

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    const lastMessage = messages[messages.length - 1];
    const isMyMessage =
      lastMessage &&
      ((typeof lastMessage.sender === "string" && lastMessage.sender === userId) ||
        (typeof lastMessage.sender === "object" && lastMessage.sender?._id === userId));

    if (isNearBottom || isMyMessage) {
      scrollToBottom("smooth");
      setHasAutoScrolled(false);
    }
  }, [messages, userId, setHasAutoScrolled]);

  useEffect(() => {
    if (!socket || !selectedFriend) return;

    const handleTyping = (senderId: string) => {
      if (senderId === selectedFriend.friendId) {
        setTypingFriend(senderId);
      }
    };

    const handleStopTyping = (senderId: string) => {
      if (senderId === selectedFriend.friendId) {
        setTypingFriend(null);
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, selectedFriend, setTypingFriend]);

  useEffect(() => {
    if (
      !socket ||
      !selectedFriend ||
      !userId ||
      !chatId ||
      messages.length === 0
    )
      return;

    // Check if there are any unread messages from the selected friend
    const hasUnreadFromFriend = messages.some(
      (msg) =>
        !msg.isRead &&
        ((typeof msg?.sender === "string" &&
          msg?.sender === selectedFriend.friendId) ||
          (typeof msg?.sender === "object" &&
            msg?.sender?._id === selectedFriend.friendId))
    );

    if (hasUnreadFromFriend) {
      // Emit read events to server
      socket.emit("messagesRead", {
        chatId,
        readerId: userId,
        senderId: selectedFriend.friendId,
      });

      socket.emit("mark_messages_read", {
        senderId: selectedFriend.friendId,
        receiverId: userId,
      });
    }
  }, [chatId, selectedFriend, socket, userId, messages]);

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSizeMB = 50; // base64-safe limit
    const validFiles = files.filter((file) => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        showToast(`${file.name} is too large. Max allowed size is ${maxSizeMB}MB.`, "warning");
        return false;
      }
      return true;
    });
    setMediaFiles(validFiles);
    setPreviewVisible(true);
  };

  const renderMediaPreviews = () => {
    return mediaFiles.map((file, index) => {
      const isImage = file.type.startsWith("image/");
      const isAudio = file.type.startsWith("audio/");

      const url = previewUrls[index] || "";

      return (
        <div key={index} className="relative">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} className="w-20 h-20 object-cover rounded" alt="Preview" />
          ) : isAudio ? (
            <audio src={url} controls className="w-[260px] md:w-[300px] h-12 rounded bg-black/10 dark:bg-white/10 p-1" />
          ) : (
            <video src={url} className="w-20 h-20 rounded" controls />
          )}
        </div>
      );
    });
  };

  // Auto-remove expired messages from local state
  useEffect(() => {
    const hasExpiring = messages.some((m) => m.expiresAt);
    if (!hasExpiring) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => !m.expiresAt || new Date(m.expiresAt).getTime() > now
        );
        // Only update if something was actually removed
        return filtered.length !== prev.length ? filtered : prev;
      });
      // Force countdown re-render
      setCountdownTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [messages, setMessages, setCountdownTick]);



  // Close actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        actionsDropdownRef.current &&
        !actionsDropdownRef.current.contains(e.target as Node)
      ) {
        setShowActionsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsDropdownRef.current &&
        !settingsDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock mobile window scroll when keyboard opens
  useEffect(() => {
    if (typeof window === "undefined") return;

    const lockScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("scroll", lockScroll);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", lockScroll);
      window.visualViewport.addEventListener("scroll", lockScroll);
    }

    return () => {
      window.removeEventListener("scroll", lockScroll);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", lockScroll);
        window.visualViewport.removeEventListener("scroll", lockScroll);
      }
    };
  }, []);

  return (
    <div className="flex flex-col bg-[var(--background)] h-full rounded-md overflow-hidden relative">
      {!loadingMessages && (selectedFriend || selectedGroup) && (
        <div className="w-full flex items-center justify-between rounded-md px-4 py-2.5 bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-30 flex-shrink-0 shadow-2xs min-h-[60px]">
          {/* Left: Back Button + Avatar + Contact Info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                setShowLeft(true);
                setSelectedFriend(null);
                setSelectedGroup(null);
                setChatId(null);
                if (typeof window !== "undefined" && window.history.state?.chatViewOpen) {
                  window.history.back();
                }
              }}
              className="p-1.5 hover:bg-[var(--muted)] rounded-full text-[var(--foreground)] transition cursor-pointer flex items-center justify-center lg:hidden"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>

            <div
              onClick={() => {
                setShowEmoji(false);
                if (selectedGroup) {
                  setShowGroupInfo(true);
                }
              }}
              className={`flex items-center gap-3 p-1 rounded-xl transition ${selectedGroup ? "cursor-pointer hover:bg-[var(--muted)]" : ""}`}
            >
              <div className="relative flex-shrink-0">
                <Image
                  src={selectedFriend?.profilePic || selectedGroup?.groupProfilePic || "/user.jpg"}
                  alt="avatar"
                  className="w-10 h-10 object-cover rounded-full border border-[var(--border)] shadow-2xs"
                  width={40}
                  height={40}
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[var(--card)] rounded-full"></span>
              </div>

              <div className="min-w-0 flex flex-col justify-center">
                <h2 className="text-sm font-bold text-[var(--foreground)] truncate max-w-[150px] sm:max-w-[280px] leading-tight">
                  {username}
                </h2>
                <p className="text-[11px] text-[var(--foreground)]/60 truncate font-medium">
                  {isTyping ? (
                    <span className="text-[var(--accent)] font-semibold animate-pulse">Chugli...</span>
                  ) : selectedGroup ? (
                    "Tap for group info"
                  ) : (
                    "online"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Disappearing Badge + Settings */}
          <div className="flex items-center gap-2">
            {selectedFriend && disappearDuration > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold flex items-center gap-1">
                <Timer size={10} />
                {disappearDuration}h
              </span>
            )}

            <div className="relative" ref={settingsDropdownRef}>
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className={`p-2 rounded-full transition cursor-pointer flex items-center justify-center ${showSettingsDropdown
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "hover:bg-[var(--muted)] text-[var(--foreground)]/80 hover:text-[var(--foreground)]"
                  }`}
                title="Settings"
              >
                <Settings size={19} />
              </button>

              <AnimatePresence>
                {showSettingsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)] rounded-xl shadow-2xl py-2 px-1 min-w-[200px] z-50 flex flex-col gap-1"
                  >
                    {selectedFriend && (
                      <div>
                        {/* Parent Dropdown Button */}
                        <button
                          onClick={() => setShowDisappearSubmenu((prev) => !prev)}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs cursor-pointer transition-all flex items-center justify-between text-[var(--foreground)] hover:bg-[var(--accent)]/10 font-medium"
                        >
                          <div className="flex items-center gap-2">
                            <Timer size={14} className="text-[var(--accent)]" />
                            <span>Disappear Messages</span>
                          </div>
                          <div className="flex items-center gap-1 text-[var(--foreground)]/60 text-[11px]">
                            <span className="font-semibold text-[var(--accent)]">
                              {DISAPPEAR_OPTIONS.find((o) => o.value === disappearDuration)?.label || (disappearDuration ? `${disappearDuration}h` : "Off")}
                            </span>
                            <ChevronDown
                              size={14}
                              className={`transition-transform duration-200 ${showDisappearSubmenu ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>

                        {/* Child Time Options Sub-Dropdown */}
                        <AnimatePresence>
                          {showDisappearSubmenu && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden pl-3 pr-1 py-1 flex flex-col gap-0.5 border-l-2 border-[var(--accent)]/30 ml-4 my-1"
                            >
                              {DISAPPEAR_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    setDisappearDuration(opt.value);
                                    setShowSettingsDropdown(false);
                                    setShowDisappearSubmenu(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-all flex items-center justify-between ${disappearDuration === opt.value
                                    ? "bg-[var(--accent)]/20 text-[var(--accent)] font-semibold"
                                    : "text-[var(--foreground)]/80 hover:bg-[var(--accent)]/10 hover:text-[var(--foreground)]"
                                    }`}
                                >
                                  <span>{opt.label}</span>
                                  {disappearDuration === opt.value && (
                                    <span className="text-[var(--accent)] text-xs font-bold">✓</span>
                                  )}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {chatId && (
                      <div className={selectedFriend ? "border-t border-[var(--border)] mt-1 pt-1" : ""}>
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            handleDeleteChat();
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all flex items-center gap-2 font-medium"
                        >
                          <Trash2 size={14} />
                          <span>Clear Chat</span>
                        </button>
                      </div>
                    )}

                    {selectedFriend && (
                      <div className="border-t border-[var(--border)] mt-1 pt-1">
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            handleRemoveFriend();
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all flex items-center gap-2 font-medium"
                        >
                          <span>Remove Friend</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Disappearing messages banner */}
      {!loadingMessages && selectedFriend && disappearDuration > 0 && (
        <div className="flex items-center justify-center gap-2 py-1.5 px-3 mx-2 my-1 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex-shrink-0">
          <span className="text-xs text-[var(--accent)] font-medium">
            Messages will disappear {disappearDuration}h after being seen
          </span>
        </div>
      )}

      {!loadingMessages && (selectedFriend || selectedGroup) ? (
        <div className="flex-1 min-h-0 relative flex flex-col">
          {/* Chat Container + Animated Floating Emojis Background */}
          <div
            ref={chatContainerRef}
            onClick={() => {
              setShowEmoji(false);
            }}
            onScroll={() => {
              if (chatContainerRef.current) {
                const el = chatContainerRef.current;
                const nearBottom =
                  el.scrollHeight - el.scrollTop - el.clientHeight < 150;
                if (!nearBottom) {
                  setHasAutoScrolled(true);
                } else {
                  setHasAutoScrolled(false);
                }
              }
            }}
            className="relative h-full bg-[var(--background)] p-4 overflow-y-auto space-y-3 select-text custom-scrollbar"
          >
            {/* Floating faint emojis animation */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              {floatingEmojis.map((e) => (
                <motion.span
                  key={e.id}
                  initial={{ opacity: 0.05, y: 0 }}
                  animate={{
                    opacity: [0.08, 0.35, 0.06],
                    y: [10, -25, 10],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 6 + Math.random() * 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute select-none pointer-events-none"
                  style={{
                    top: `${e.y}%`,
                    left: `${e.x}%`,
                    fontSize: `${e.size}rem`,
                    opacity: 0.9,
                    filter: "blur(0.5px)",
                  }}
                >
                  {e.emoji}
                </motion.span>
              ))}
            </div>

            {messages?.length > 0 &&
              messages?.map((msg, idx) => {
                const isSentByUser =
                  (typeof msg?.sender === "string" && msg?.sender === userId) ||
                  (typeof msg?.sender === "object" &&
                    msg?.sender?._id === userId);
                const isFromFriend =
                  (typeof msg.sender === "string" &&
                    msg?.sender === selectedFriend?.friendId) ||
                  (typeof msg.sender === "object" &&
                    msg?.sender?._id === selectedFriend?.friendId);
                const isGroupChat = !!selectedGroup;
                const hasAudio = !!(msg.media && msg.media.some(url => {
                  const cleanUrl = url.split("#")[0].toLowerCase();
                  const isBlob = cleanUrl.startsWith("blob:") || cleanUrl.startsWith("data:audio");
                  return isBlob
                    ? cleanUrl.includes("audio")
                    : (cleanUrl.endsWith(".webm") || cleanUrl.endsWith(".mp3") || cleanUrl.endsWith(".wav") || cleanUrl.endsWith(".ogg") || cleanUrl.endsWith(".m4a") || cleanUrl.includes("/video/upload/") || cleanUrl.endsWith(".mp4"));
                }));

                if (!isSentByUser && !isFromFriend && !isGroupChat) return null;

                return (
                  <div
                    key={msg?._id || idx}
                    className={`p-3 relative max-w-[82%] sm:max-w-[70%] w-fit break-words whitespace-pre-wrap group rounded-2xl shadow-xs z-10 transition-all ${isSentByUser
                      ? "whatsapp-bubble-sent ml-auto rounded-tr-xs bg-[var(--bubble-sent)] text-[var(--bubble-sent-text)] border border-[var(--accent)]/15"
                      : "whatsapp-bubble-received mr-auto rounded-tl-xs bg-[var(--bubble-received)] text-[var(--bubble-received-text)] border border-[var(--border)]/40"
                      } ${hasAudio ? "min-w-[280px] sm:min-w-[325px]" : ""}`}
                  >
                    {/* Delete Message Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMessage(msg?._id, !!selectedGroup);
                      }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 max-md:opacity-60 bg-black/40 hover:bg-black/60 text-white rounded p-1 transition-all text-[10px] cursor-pointer z-20"
                      title="Delete Message"
                    >
                      <Trash2 size={11} />
                    </button>

                    {/* Sender Name in Group Chat */}
                    {isGroupChat && !isSentByUser && typeof msg.sender === "object" && (
                      <p className={`text-xs font-bold mb-1 ${colors[idx % colors.length]}`}>
                        {msg.sender.username}
                      </p>
                    )}

                    {/* Media Attachments */}
                    {msg.media && msg.media?.length > 0 && (
                      <div className="relative mb-1.5">
                        <div
                          className={`grid ${msg.media?.length > 1 ? "grid-cols-2" : "grid-cols-1"} gap-2`}
                          onClick={(e) => {
                            const target = e.target as HTMLMediaElement;
                            const children = Array.from(e.currentTarget.children);
                            const index = children.findIndex(
                              (child) => child === target.closest("video, img")
                            );
                            if (index !== -1) {
                              setModalMedia((msg.media || []).map((u) => u.split("#")[0]));
                              setCurrentMediaIndex(index);
                              setShowMediaModal(true);
                            }
                          }}
                        >
                          {(msg.media || []).slice(0, 3).map((url, index) => {
                            const cleanUrl = url.split("#")[0];
                            const openModal = () => {
                              setModalMedia((msg.media || []).map((u) => u.split("#")[0]));
                              setCurrentMediaIndex(index);
                              setShowMediaModal(true);
                            };

                            const isBlob = url.startsWith("blob:") || url.startsWith("data:audio");
                            const isAudio = isBlob
                              ? url.includes("audio")
                              : (url.endsWith(".webm") || url.endsWith(".mp3") || url.endsWith(".wav") || url.endsWith(".ogg") || url.endsWith(".m4a") || url.includes("/video/upload/") || url.endsWith(".mp4"));
                            const isVideo = !isAudio && (isBlob
                              ? url.includes("video")
                              : (url.endsWith(".mov") || url.endsWith(".avi") || url.endsWith(".mkv")));

                            return isVideo ? (
                              <video
                                key={index}
                                src={cleanUrl}
                                onClick={openModal}
                                className="w-28 h-28 cursor-pointer rounded-xl border border-[var(--border)] object-cover shadow-2xs"
                              />
                            ) : isAudio ? (
                              <div key={index} className="flex items-center gap-2 p-1.5 bg-black/5 dark:bg-white/10 rounded-xl w-full">
                                <audio
                                  src={cleanUrl}
                                  className="w-full h-8 outline-none"
                                  controls
                                />
                              </div>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={index}
                                src={cleanUrl}
                                onClick={openModal}
                                alt="attachment"
                                className="w-28 h-28 rounded-xl cursor-pointer border border-[var(--border)] object-cover shadow-2xs"
                              />
                            );
                          })}

                          {(msg.media?.length || 0) > 3 && (
                            <div
                              onClick={() => {
                                setModalMedia((msg.media || []).map((u) => u.split("#")[0]));
                                setCurrentMediaIndex(3);
                                setShowMediaModal(true);
                              }}
                              className="w-28 h-28 flex items-center justify-center bg-black/40 text-white font-bold text-sm rounded-xl cursor-pointer"
                            >
                              +{(msg.media?.length || 0) - 3}
                            </div>
                          )}
                        </div>
                        {msg.uploading && (
                          <div className="absolute inset-0 bg-black/45 rounded-xl flex items-center justify-center z-10 pointer-events-none">
                            <Loader2 className="animate-spin text-white" size={24} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Border between Media and Text content */}
                    {msg.media && msg.media.length > 0 && msg.content && msg.content.trim() && (
                      <div
                        className={`w-full my-2.5 border-t-[1.5px] ${
                          isSentByUser
                            ? "border-white/45 dark:border-white/45 border-black/25"
                            : "border-black/20 dark:border-white/35"
                        }`}
                      />
                    )}

                    {/* Text content */}
                    {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}

                    {/* Bubble Metadata Footer */}
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-70 select-none">
                      {msg.expiresAt && (
                        <span className="flex items-center gap-0.5 text-amber-500 font-medium">
                          <Timer size={10} /> {formatCountdown(msg.expiresAt)}
                        </span>
                      )}

                      {msg.createdAt && (
                        <span>{formatMessageTime(msg.createdAt)}</span>
                      )}

                      {isSentByUser && (
                        (() => {
                          if (selectedGroup) {
                            const otherMembersCount = Math.max(1, (selectedGroup.groupMember?.length || 2) - 1);
                            const seenOthers = (msg.seenBy || []).filter((u: any) => {
                              const id = typeof u === 'object' ? u._id : u;
                              return id && id !== userId;
                            });
                            const allSeen = seenOthers.length >= otherMembersCount;
                            const someSeen = seenOthers.length > 0;

                            return (
                              <span className={allSeen ? "text-sky-500 font-bold" : someSeen ? "text-sky-400/80 font-medium" : "opacity-60"}>
                                ✓✓
                              </span>
                            );
                          }

                          return (
                            <span className={msg.isRead ? "text-sky-500 font-bold" : "opacity-60"}>
                              ✓✓
                            </span>
                          );
                        })()
                      )}

                      {selectedGroup && msg.seenBy && msg.seenBy.length > 0 && (
                        <div className="flex items-center space-x-0.5 ml-1">
                          {msg.seenBy
                            .filter((u: any) => (typeof u === 'object' ? u._id !== userId : u !== userId))
                            .slice(0, 3)
                            .map((user: any, i: number) => (
                              <Image
                                key={i}
                                src={(typeof user === 'object' && user.profilePic) ? user.profilePic : "/user.jpg"}
                                title={typeof user === 'object' ? user.username : 'Member'}
                                alt="Seen by avatar"
                                className="w-3.5 h-3.5 rounded-full border border-[var(--card)]"
                                width={14}
                                height={14}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            {typingFriend && (
              <div className="text-xs italic text-[var(--accent)] font-semibold bg-[var(--card)] px-3 py-1.5 rounded-full w-fit shadow-xs">
                {typingFriend} is Chugli...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 bg-[var(--background)] p-4 flex items-center justify-center">
          <ScaleTN variant="chat" />
        </div>
      )}

      {/* Media Previews Bar */}
      {!loadingMessages &&
        (selectedFriend || selectedGroup) &&
        previewVisible &&
        mediaFiles.length > 0 && (
          <div className="relative flex flex-wrap gap-2 p-2 bg-[var(--card)] border-t border-[var(--border)]">
            {renderMediaPreviews()}
            <span className="text-[var(--foreground)] text-xs font-medium ml-2 self-center">
              {mediaFiles.length} file(s) attached
            </span>

            <div
              className="absolute top-2 right-2 cursor-pointer p-1 rounded-full hover:bg-[var(--muted)]"
              onClick={() => {
                setPreviewVisible(false);
                setMediaFiles([]);
              }}
            >
              <X size={16} className="text-[var(--foreground)]" />
            </div>
          </div>
        )}

      {/* WhatsApp Input Bar */}
      {!loadingMessages && (selectedFriend || selectedGroup) && (
        <div className="bg-[var(--card)] rounded-md border-t border-[var(--border)] p-2.5 px-4 flex items-center gap-2 relative z-20 flex-shrink-0 shadow-xs lg:mb-[1rem] xl:mb-0">
          <input
            type="file"
            name="media"
            aria-label="Upload media"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            className="hidden"
            id="upload"
          />

          {/* Emoji Picker toggle button */}
          <div className="relative">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="p-2 rounded-full hover:bg-[var(--muted)] text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition cursor-pointer text-xl flex items-center justify-center"
              title="Choose Emoji"
            >
              😀
            </button>
            {showEmoji && (
              <EmojiPicker
                onEmojiClick={(emoji) => setMessageInput((prev) => prev + emoji)}
              />
            )}
          </div>

          {/* Attachment Clip button */}
          <label
            htmlFor="upload"
            className="p-2 rounded-full hover:bg-[var(--muted)] text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition cursor-pointer flex items-center justify-center"
            title="Attach Media"
          >
            <Plus size={22} />
          </label>

          {/* WhatsApp Textarea Input */}
          <div className="flex-1 min-w-0 bg-[var(--input)] border border-[var(--border)] focus-within:border-[var(--accent)] rounded-2xl px-4 py-1.5 transition flex items-center">
            {isRecordingVoice ? (
              <div className="flex-1 text-rose-500 flex items-center gap-2 animate-pulse font-medium text-xs py-1 select-none">
                <span>🔴</span>
                <span>Recording voice message...</span>
              </div>
            ) : (
              <textarea
                value={messageInput}
                onChange={handleInputChange}
                onFocus={() => {
                  setShowEmoji(false);
                  if (typeof window !== "undefined") {
                    window.scrollTo(0, 0);
                    setTimeout(() => {
                      window.scrollTo(0, 0);
                      if (chatContainerRef.current) {
                        chatContainerRef.current.scrollTo({
                          top: chatContainerRef.current.scrollHeight,
                          behavior: "smooth",
                        });
                      }
                    }, 100);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="w-full bg-transparent text-[var(--foreground)] outline-none resize-none text-sm placeholder:text-[var(--foreground)]/40 max-h-24 custom-scrollbar"
                placeholder="Type a message..."
                rows={1}
              />
            )}
          </div>

          {/* Dynamic Send / Mic Action Button */}
          <button
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={() => {
              if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
              }
              if (isRecordingVoice) {
                stopVoiceRecording();
              }
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              handlePressStart(e);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handlePressEnd(e);
            }}
            onClick={() => {
              if (messageInput.trim() || mediaFiles.length > 0) {
                sendMessage();
              }
            }}
            className={`p-3 rounded-full cursor-pointer transition-all flex items-center justify-center shadow-2xs ${isRecordingVoice
              ? "bg-rose-600 animate-pulse text-white shadow-rose-500/30"
              : "bg-[var(--accent)] hover:opacity-90 text-white"
              }`}
            title={
              isRecordingVoice
                ? "Release to Preview"
                : messageInput.trim() || mediaFiles.length > 0
                  ? "Send Message"
                  : "Hold to record voice"
            }
          >
            {isRecordingVoice ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <SendHorizontal size={18} />
            )}
          </button>
        </div>
      )}
      <MediaViewerModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        media={modalMedia}
        initialIndex={currentMediaIndex}
      />
      <GroupInfoModal
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
      />
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--card)] border border-[var(--accent)]/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-[var(--foreground)]"
            >
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                {confirmModal.title}
              </h3>
              <p className="text-sm text-[var(--foreground)]/80 mb-6 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-[var(--accent)]/10 border border-transparent hover:border-[var(--accent)]/30 transition-all cursor-pointer text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
