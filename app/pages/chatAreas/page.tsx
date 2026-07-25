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
import { X, Timer, ChevronDown, Plus, SendHorizontal, Loader2, ArrowLeft, Settings } from "lucide-react";
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
}

// Disappearing message timer options (hours)
const DISAPPEAR_OPTIONS = [
  { label: "1h", value: 1 },
  { label: "4h", value: 4 },
  { label: "8h", value: 8 },
  { label: "12h", value: 12 },
  { label: "24h", value: 24 },
];

// Helper: format remaining time for countdown
function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `⏳ ${hours}h ${minutes}m`;
  if (minutes > 0) return `⏳ ${minutes}m ${seconds}s`;
  return `⏳ ${seconds}s`;
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
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/message/markMessage`, {
              method: "POST",
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
      if (message.chatId !== chatId) return; // Only if it's the open chat
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
      if (message.groupId === selectedGroup._id) {
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

    const handleGroupSeenUpdate = ({
      groupId: seenGroupId,
      messages: updatedMessges,
    }: {
      groupId: string;
      messages: Message[];
    }) => {
      if (selectedGroup && seenGroupId === selectedGroup._id) {
        setMessages(updatedMessges);
      }
    };

    socket.on("newGroupMessage", handleGroupMessage);
    socket.on("groupSeenUpdate", handleGroupSeenUpdate);

    return () => {
      socket.off("newGroupMessage", handleGroupMessage);
      socket.off("groupSeenUpdate", handleGroupSeenUpdate);
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

      // If the server sent back updated messages (with expiresAt set), use them
      if (updatedMessages && updatedMessages.length > 0) {
        setMessages(updatedMessages);
      } else {
        // Fallback: just mark as read locally
        setMessages((prevMessages) =>
          prevMessages?.map((msg) => {
            const isSenderCurrentUser =
              (typeof msg?.sender === "string" && msg?.sender === userId) ||
              (typeof msg?.sender === "object" && msg?.sender?._id === userId);
            return isSenderCurrentUser && msg?.chatId === ackChatId
              ? { ...msg, isRead: true }
              : msg;
          })
        );
      }
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
      if (selectedGroup && groupId === selectedGroup?._id) {
        setMessages(updatedMessages);
      }
    };

    socket.on("groupSeenUpdate", handleSeenUpdate);

    return () => {
      socket.off("groupSeenUpdate", handleSeenUpdate);
    };
  }, [socket, selectedGroup, setMessages]);

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
      bottomRef.current?.scrollIntoView({ behavior });
      // Staggered timeouts to ensure it scrolls down even if images/elements finish layout late
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior });
      }, 50);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior });
      }, 150);
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

  // console.log("selectedFriend", selectedFriend)
  // console.log("messages", messages);
  return (
    <div className="flex flex-col bg-[var(--background)] h-full p-2 pb-5 rounded-md overflow-hidden">
      {!loadingMessages && (selectedFriend || selectedGroup) && (
        <div className="w-full flex flex-row items-center justify-between p-3 border-b border-[var(--accent)]/20 relative min-h-[58px]">
          {/* Left: Back Button */}
          <div className="flex items-center">
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
              className="p-2 hover:bg-[var(--accent)]/15 rounded-lg text-[var(--foreground)] transition-all cursor-pointer flex items-center justify-center"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          {/* Center: Profile Pic + Name */}
          <div
            onClick={() => {
              setShowEmoji(false);
              if (selectedGroup) {
                setShowGroupInfo(true);
              }
            }}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-row items-center gap-2 px-3 py-1.5 rounded-xl transition duration-200 ${selectedGroup ? "cursor-pointer hover:bg-[var(--accent)]/15" : ""
              }`}
          >
            <Image
              src={selectedFriend?.profilePic || selectedGroup?.groupProfilePic || "/user.jpg"}
              alt="avatar"
              className="w-[30px] h-[30px] object-cover rounded-full border border-[var(--accent)] flex-shrink-0"
              width={30}
              height={30}
            />

            <h2 className="flex items-center text-lg font-semibold space-x-1 text-[var(--foreground)] truncate max-w-[150px] sm:max-w-[250px]">
              <div className="flex">
                {username.split("").map((char, i) => (
                  <motion.span
                    key={i}
                    className={`${colors[i % colors.length]} inline-block`}
                    animate={{
                      y: [0, -6, 0], // Jump up and down
                    }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.1, // Stagger each letter
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeInOut",
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </div>
            </h2>

            {/* Disappearing messages indicator — only for 1-1 chats */}
            {selectedFriend && disappearDuration > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 flex items-center gap-0.5">
                <Timer size={10} />
                {disappearDuration}h
              </span>
            )}
          </div>

          {/* Right: Settings Icon & Dropdown */}
          <div className="relative" ref={settingsDropdownRef}>
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${showSettingsDropdown
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "hover:bg-[var(--accent)]/15 text-[var(--foreground)]"
                }`}
              title="Settings"
            >
              <Settings size={20} />
            </button>

            <AnimatePresence>
              {showSettingsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 bg-[var(--card)]/95 backdrop-blur-md border border-[var(--accent)]/30 rounded-xl shadow-2xl py-2 px-1 min-w-[200px] z-50 flex flex-col gap-1"
                >
                  {/* Disappearing Messages Settings */}
                  {selectedFriend && (
                    <div className="px-1 py-1">
                      <div className="text-[10px] text-[var(--foreground)]/50 px-3 py-1 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Timer size={10} /> Disappearing messages
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {DISAPPEAR_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setDisappearDuration(opt.value);
                              setShowSettingsDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all flex items-center justify-between ${disappearDuration === opt.value
                                ? "bg-[var(--accent)]/20 text-[var(--accent)] font-semibold"
                                : "text-[var(--foreground)] hover:bg-[var(--accent)]/10"
                              }`}
                          >
                            <span>⏱️ {opt.label} timer</span>
                            {disappearDuration === opt.value && (
                              <span className="text-[var(--accent)]">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delete Chat */}
                  {chatId && (
                    <div className={selectedFriend ? "border-t border-[var(--accent)]/20 mt-1 pt-1" : ""}>
                      <button
                        onClick={() => {
                          setShowSettingsDropdown(false);
                          handleDeleteChat();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all flex items-center gap-2 font-medium"
                      >
                        <span>🗑️</span>
                        <span>Clear Chat</span>
                      </button>
                    </div>
                  )}

                  {/* Remove Friend */}
                  {selectedFriend && (
                    <div className="border-t border-[var(--accent)]/20 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setShowSettingsDropdown(false);
                          handleRemoveFriend();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all flex items-center gap-2 font-medium"
                      >
                        <span>👤❌</span>
                        <span>Remove Friend</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Disappearing messages banner — only for 1-1 chats */}
      {!loadingMessages && selectedFriend && disappearDuration > 0 && (
        <div className="flex items-center justify-center gap-2 py-1.5 px-3 mx-2 mb-1 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20">
          <span className="text-xs text-[var(--accent)]">
            🔒 Messages will disappear {disappearDuration}h after being seen
          </span>
        </div>
      )}
      {!loadingMessages && (selectedFriend || selectedGroup) ? (
        <div className="flex-1 min-h-0 bg-[var(--background)] p-2 rounded-md shadow-inner space-y-2">
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
                  setHasAutoScrolled(true); // User scrolled up
                } else {
                  setHasAutoScrolled(false); // User is at bottom
                }
              }
            }}
            className="relative h-full bg-[var(--muted)] p-4 rounded-lg shadow-inner overflow-y-auto space-y-2 select-text"
          >
            {/* 🌸 Floating faint emojis */}
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
                  const cleanUrl = url.split("#")[0];
                  const isBlob = url.startsWith("blob:");
                  return isBlob
                    ? url.includes("audio")
                    : (url.endsWith(".webm") || url.endsWith(".mp3") || url.endsWith(".wav") || url.endsWith(".ogg") || url.endsWith(".m4a"));
                }));
                // const isFromFriend = senderId === selectedFriend?.friendId;

                // Only render messages sent by you or the selected friend
                if (!isSentByUser && !isFromFriend && !isGroupChat) return null;
                // console.log("msg", msg)
                return (
                  <div
                    key={msg?._id || idx}
                    className={` p-3 pr-8 relative rounded-md max-w-[70%] w-fit break-words whitespace-pre-wrap group ${hasAudio ? "min-w-[285px] md:min-w-[325px]" : ""
                      }`}
                    // ${
                    //   isSentByUser
                    //     ? "bg-lime-400 ml-auto"
                    //     : "bg-lime-100 mr-auto"
                    // }
                    style={{
                      backgroundColor: isSentByUser
                        ? "var(--primary)"
                        : "var(--card)",
                      color: isSentByUser
                        ? "var(--card-foreground)"
                        : "var(--foreground)",
                      marginLeft: isSentByUser ? "auto" : "0",
                      marginRight: isSentByUser ? "0" : "auto",
                    }}
                  >
                    {/* Delete Message Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMessage(msg?._id, !!selectedGroup);
                      }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 max-md:opacity-60 bg-black/40 hover:bg-black/60 text-white rounded p-0.5 transition-all text-[10px] cursor-pointer z-20"
                      title="Delete Message"
                    >
                      🗑️
                    </button>

                    {msg.media && msg.media?.length > 0 && (
                      <div className="relative">
                        <div
                          className={`grid ${msg.media?.length > 1 ? "grid-cols-2" : "grid-cols-1"
                            } gap-2`}
                          onClick={(e) => {
                            // Find the index of the clicked child
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

                            const isBlob = url.startsWith("blob:");
                            const isVideo = isBlob
                              ? url.includes("video")
                              : (url.endsWith(".mp4") || url.endsWith(".mov") || url.endsWith(".avi") || url.endsWith(".mkv"));
                            const isAudio = isBlob
                              ? url.includes("audio")
                              : (url.endsWith(".webm") || url.endsWith(".mp3") || url.endsWith(".wav") || url.endsWith(".ogg") || url.endsWith(".m4a"));

                            return isVideo ? (
                              <video
                                key={index}
                                src={cleanUrl}
                                onClick={openModal}
                                className="w-24 h-24 cursor-pointer rounded-md border border-[var(--accent)] object-cover"
                              />
                            ) : isAudio ? (
                              <div key={index} className="flex items-center gap-2 p-1 bg-black/10 dark:bg-white/10 rounded-lg w-full">
                                {/* <span className="text-xl pl-1" title="Voice Message">🎙️</span> */}
                                <audio
                                  src={cleanUrl}
                                  className="w-full h-8 outline-none filter invert-0"
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
                                className="w-24 h-24 rounded cursor-pointer border border-[var(--accent)] object-cover"
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
                              className="w-24 h-24 flex items-center justify-center bg-[var(--background)] bg-opacity-60 text-[var(--foreground)] rounded cursor-pointer"
                            >
                              +{(msg.media?.length || 0) - 3}
                            </div>
                          )}
                        </div>
                        {msg.uploading && (
                          <div className="absolute inset-0 bg-black/45 rounded-md flex items-center justify-center z-10 pointer-events-none">
                            <Loader2 className="animate-spin text-white" size={24} />
                          </div>
                        )}
                      </div>
                    )}
                    {msg.content}
                    {/* Disappearing message countdown */}
                    {msg.expiresAt && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] opacity-70" style={{ color: isSentByUser ? 'var(--card-foreground)' : 'var(--foreground)' }}>
                        <Timer size={10} />
                        <span>{formatCountdown(msg.expiresAt)}</span>
                      </div>
                    )}
                    {isSentByUser && msg.isRead && selectedFriend && (
                      <span className="text-xs absolute right-0 bottom-0 text-[var(--muted)] ml-2">
                        👀
                      </span>
                    )}

                    {selectedGroup && msg.seenBy && msg.seenBy.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        {msg.seenBy
                          .filter((u) => u._id !== userId)
                          .slice(0, 3)
                          .map((user, i) => (
                            <Image
                              key={i}
                              src={user.profilePic || "/user.jpg"}
                              title={user.username}
                              alt="Seen by avatar"
                              className="w-4 h-4 rounded-full border border-[var(--accent)]"
                              width={16}
                              height={16}
                            />
                          ))}
                        {msg.seenBy.length > 4 && (
                          <span className="text-xs text-[var(--muted)]">
                            +{msg.seenBy.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            {typingFriend && (
              <div className="text-sm italic text-[var(--accent)]">
                Typing...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 bg-[var(--muted)] p-4 rounded-lg flex items-center justify-center text-[var(--foreground)] text-sm">
          <ScaleTN variant="chat" />
        </div>
      )}
      {!loadingMessages &&
        (selectedFriend || selectedGroup) &&
        previewVisible &&
        mediaFiles.length > 0 && (
          <div className=" relative flex flex-wrap gap-2 mb-2">
            {renderMediaPreviews()}
            <span className="text-[var(--foreground)] absolute bottom-1 right-0 text-sm ml-2">
              {mediaFiles.length} selected
            </span>

            <div
              className="absolute top-1 right-0 cursor-pointer"
              onClick={() => {
                setPreviewVisible(false);
                setMediaFiles([]);
              }}
            >
              <X className="hover:text-[var(--accent)]" />
            </div>
          </div>
        )}

      {!loadingMessages && (selectedFriend || selectedGroup) && (
        <div className="flex flex-row items-center justify-center mt-4 gap-2">
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

          {/* Desktop-only action buttons */}
          <div className="hidden lg:flex flex-row items-center gap-2">
            <label
              htmlFor="upload"
              title="Send Media"
              aria-label="Send media"
              className="flex justify-center items-center cursor-pointer px-4 py-2 border-1 border-[var(--accent)] hover:bg-[var(--accent)]/15 text-[var(--foreground)] bg-[var(--card)] rounded"
            >
              📷
            </label>

            {/* Voice Recorder Button */}
            <VoiceRecorder
              onSend={(audioFile) => {
                setMediaFiles((prev) => [...prev, audioFile]); // Add to mediaFiles
                setPreviewVisible(true); // Show in preview
              }}
            />
          </div>

          {/* Mobile-only Action Dropdown */}
          <div className="flex lg:hidden relative" ref={actionsDropdownRef}>
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              className={`flex justify-center items-center cursor-pointer p-2.5 border border-[var(--accent)] rounded-lg transition-all ${showActionsDropdown
                ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                : "bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]/15"
                }`}
              title="More actions"
            >
              <Plus size={20} />
            </button>

            <AnimatePresence>
              {showActionsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 left-0 bg-[var(--card)]/95 backdrop-blur-md border border-[var(--accent)]/30 rounded-xl shadow-2xl py-2 px-1 min-w-[200px] z-50 flex flex-col gap-1"
                >
                  {/* Send Media */}
                  <label
                    htmlFor="upload"
                    onClick={() => setShowActionsDropdown(false)}
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--accent)]/10 cursor-pointer transition-all"
                  >
                    <span className="text-lg">📷</span>
                    <span>Send Media</span>
                  </label>

                  {/* Voice Recorder */}
                  <div className="flex items-center gap-3 w-full px-3 py-1.5 rounded-lg hover:bg-[var(--accent)]/10 transition-all">
                    <VoiceRecorder
                      onSend={(audioFile) => {
                        setMediaFiles((prev) => [...prev, audioFile]);
                        setPreviewVisible(true);
                        setShowActionsDropdown(false);
                      }}
                    />
                    <span className="text-sm text-[var(--foreground)]">Record Voice</span>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Emoji button */}
          <div className="relative">
            <div
              className="cursor-pointer px-4 py-2 text-[var(--foreground)] hover:bg-[var(--accent)]/15 border-1 border-[var(--accent)] bg-[var(--card)] rounded"
              onClick={() => setShowEmoji(!showEmoji)}
            >
              😀
            </div>
            {showEmoji && (
              <EmojiPicker
                onEmojiClick={(emoji) => setMessageInput((prev) => prev + emoji)}
              />
            )}
          </div>

          {isRecordingVoice ? (
            <div className="flex-1 px-4 py-2 rounded-md bg-rose-500/10 text-rose-500 flex items-center gap-2 animate-pulse font-medium text-sm border border-rose-500/20 select-none">
              <span>🔴</span>
              <span>Recording...</span>
            </div>
          ) : (
            <textarea
              value={messageInput}
              onChange={handleInputChange}
              onFocus={() => setShowEmoji(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); // Prevent newline
                  sendMessage();
                }
              }}
              className="flex-1 px-4 py-2 rounded-md bg-[var(--card)] text-[var(--foreground)] outline-none resize-none"
              placeholder="Type a message..."
              rows={1}
            />
          )}
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
            className={`ml-2 p-3 rounded-full cursor-pointer hover:opacity-90 transition-all flex items-center justify-center ${isRecordingVoice
              ? "bg-rose-600 animate-pulse text-white shadow-lg shadow-rose-500/30"
              : "bg-[var(--accent)] text-[var(--card-foreground)]"
              }`}
            title={isRecordingVoice ? "Release to Preview" : "Hold 3s to Record / Click to Send"}
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
