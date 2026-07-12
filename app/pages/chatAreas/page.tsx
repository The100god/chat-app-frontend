"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAtom } from "jotai";
import {
  floatingEmojisAtom,
  friendsAtom,
  loadingMessageAtom,
  messageAtom,
  selectedFriendAtom,
  selectedGroupAtom,
  userIdAtom,
  disappearDurationAtom,
} from "../../states/States";
import MediaViewerModal from "../../components/MediaViewerModal";
import EmojiPicker from "../../components/EmojiPicker";
import VoiceRecorder from "../../components/VoiceRecorder";
import { X, Timer, ChevronDown } from "lucide-react";
import ScaleTN from "../../components/ScaleTN";
import { motion, AnimatePresence } from "framer-motion";

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
  const socket = useSocket(userId);
  // const hasMounted = useRef(false);
  const shouldScroll = useRef(true);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [modalMedia, setModalMedia] = useState<string[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFriend] = useAtom(selectedFriendAtom);
  const [messages, setMessages] = useAtom(messageAtom);
  const [messageInput, setMessageInput] = useState<string>("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [friends, setFriends] = useAtom(friendsAtom);
  const [isTyping, setIsTyping] = useState(false);
  const [typingFriend, setTypingFriend] = useState<string | null>(null);
  let typingTimeout: NodeJS.Timeout;
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [loadingMessages, setLoadingMessages] = useAtom(loadingMessageAtom);
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [floatingEmojis] = useAtom(floatingEmojisAtom);
  //group
  const [selectedGroup] = useAtom(selectedGroupAtom);
  // Disappearing messages
  const [disappearDuration, setDisappearDuration] = useAtom(disappearDurationAtom);
  const [showTimerDropdown, setShowTimerDropdown] = useState(false);
  const [, setCountdownTick] = useState(0); // forces re-render for countdown
  const timerDropdownRef = useRef<HTMLDivElement | null>(null);
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
            // console.log("Joining chat room:", data._id);
            socket.emit("join", data._id);
          }

          const messagesRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/message/${data._id}`
          );
          const messagesData = await messagesRes.json();
          if (messagesData.length > 0) {
            setMessages(messagesData);
            setLoadingMessages(false);
          } else {
            setMessages([]); // or handle the error gracefully
            setLoadingMessages(false);
            console.error("Fetched messages is not an array", messagesData);
          }
        } else if (selectedGroup) {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/groups/group-message/${selectedGroup._id}`
          );
          const messagesData = await res.json();
          setChatId(selectedGroup._id);

          if (socket && selectedGroup) {
            socket.emit("groupMessagesRead", {
              groupId: selectedGroup._id,
              readerId: userId,
            });
          }

          if (messagesData.length > 0) {
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
  }, [selectedFriend, selectedGroup, socket, userId]);

  useEffect(() => {
    if (socket && selectedGroup?._id) {
      socket.emit("joinGroup", selectedGroup._id);
      // console.log("🔗 Joined group socket room:", selectedGroup._id);
    }
  }, [selectedGroup, socket]);

  // Receive new messages via Socket.IO
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = (message: Message) => {
      if (message.chatId !== chatId) return; // Only if it's the open chat
      setMessages((prev) => {
        const alreadyExists = prev.some((m) => m._id === message._id);
        if (!alreadyExists) {
          return [...prev, message];
        }
        return prev;
      });
      // if (message.chatId === chatId) {
      //   setMessages((prev) => [...prev, message]);
      // }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, chatId, selectedFriend]);

  useEffect(() => {
    if (!socket || !selectedGroup) return;

    const handleGroupMessage = (message: Message) => {
      // console.log("handleGroupMessage", message);
      if (message.groupId === selectedGroup._id) {
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m._id === message._id);
          if (!alreadyExists) {
            return [...prev, message];
          }
          return prev;
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
  }, [socket, chatId, selectedGroup]);

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
        mediaFiles.map((file) => convertToBase64(file))
      );
      // console.log("media", mediaBase64);
      // Include disappearDuration for 1-1 chats (0 = permanent)
      const newMessage = {
        chatId,
        senderId: userId,
        receiverId: selectedFriend?.friendId,
        content: messageInput.trim(),
        media: mediaBase64,
        isRead: false,
        disappearDuration: selectedFriend ? disappearDuration : 0,
      };
      // setMessages((prev) => [
      //   ...prev,
      //   {
      //     ...newMessage,
      //     sender: userId,
      //     _id: `local-${Date.now()}`, // temporary until real _id from backend
      //   },
      // ]);

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
              content: messageInput.trim(),
              media: mediaBase64,
            }
            : newMessage
        ),
      });

      const savedMessage = await res.json();

      // console.log("saveMessage", savedMessage);

      setLoadingMessages(false);
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
            senderId: savedMessage.sender?._id,
            receiverId: savedMessage.receiver,
            media: savedMessage.media,
            content: savedMessage.content,
          }
      );

      // Update local message state
      setMediaFiles([]);
      setPreviewVisible(false);
      setMessageInput("");
      setShowEmoji(false);
    } catch (err) {
      console.error("Error sending message:", err);
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
  }, [socket, userId]);

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
  }, [socket, selectedGroup]);

  useEffect(() => {
    if (!hasAutoScrolled && shouldScroll.current && bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setHasAutoScrolled(true); // prevent future auto-scrolls
      }, 100);
      // bottomRef.current.scrollIntoView({ behavior: "auto" });
      // bottomRef.current.
    }
  }, [messages]);

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
  }, [socket, selectedFriend]);

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
  }, [chatId, selectedFriend, socket, userId, messages.length]);

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSizeMB = 50; // base64-safe limit
    const validFiles = files.filter((file) => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        alert(`${file.name} is too large. Max allowed size is ${maxSizeMB}MB.`);
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

      const url = URL.createObjectURL(file);
      // console.log("type", url);

      return (
        <div key={index} className="relative">
          {isImage ? (
            <img src={url} className="w-20 h-20 object-cover rounded" />
          ) : isAudio ? (
            <audio src={url} controls className="w-[25vw] h-20 rounded" />
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
  }, [messages]);

  // Close timer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        timerDropdownRef.current &&
        !timerDropdownRef.current.contains(e.target as Node)
      ) {
        setShowTimerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // console.log("selectedFriend", selectedFriend)
  // console.log("messages", messages);
  return (
    <div className="flex flex-col bg-[var(--background)] h-full p-2 pb-5 rounded-md overflow-y-auto">
      {!loadingMessages && (
        <div
          onClick={() => {
            setShowEmoji(false);
          }}
          className="flex flex-row justify-center items-center gap-2 p-3"
        >
          {(selectedFriend || selectedGroup) && (
            <img
              src={selectedFriend?.profilePic || selectedGroup?.groupProfilePic}
              alt="image"
              className="w-[30px] h-[30px] object-cover rounded-full border border-[var(--accent)]"
            />
          )}

          <h2 className="flex justify-center items-center text-xl font-semibold space-x-1 text-[var(--foreground)]">
            {selectedFriend || selectedGroup ? (
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
                    {char}
                  </motion.span>
                ))}
              </div>
            ) : (
              <span className="text-[var(--muted)]">{username}</span>
            )}
          </h2>

          {/* Disappearing messages indicator — only for 1-1 chats */}
          {selectedFriend && disappearDuration > 0 && (
            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 flex items-center gap-1">
              <Timer size={12} />
              {disappearDuration}h
            </span>
          )}
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
      {!loadingMessages ? (
        <div
          ref={chatContainerRef}
          className="h-[85%] bg-[var(--background)] p-2 rounded-md shadow-inner overflow-y-auto space-y-2"
          onScroll={() => {
            if (chatContainerRef.current) {
              const el = chatContainerRef.current;
              const nearBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 100;
              if (!nearBottom) {
                setHasAutoScrolled(true); // User scrolled up
              }
            }
          }}
        >
          <div
            onClick={() => {
              setShowEmoji(false);
            }}
            className=" relative h-full bg-[var(--muted)] p-4 rounded-lg shadow-inner overflow-y-auto space-y-2"
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
                // const isFromFriend = senderId === selectedFriend?.friendId;

                // Only render messages sent by you or the selected friend
                if (!isSentByUser && !isFromFriend && !isGroupChat) return null;
                // console.log("msg", msg)
                return (
                  <div
                    key={msg?._id || idx}
                    className={` p-3 pr-4 relative rounded-md max-w-[70%] w-fit break-words whitespace-pre-wrap`}
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
                    {msg.media && msg.media?.length > 0 && (
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
                          // console.log("index", index)
                          if (index !== -1) {
                            setModalMedia(msg.media || []);
                            setCurrentMediaIndex(index);
                            setShowMediaModal(true);
                          }
                        }}
                      >
                        {(msg.media || []).slice(0, 3).map((url, index) => {
                          const openModal = () => {
                            setModalMedia(msg.media || []);
                            setCurrentMediaIndex(index);
                            setShowMediaModal(true);
                          };

                          return url.endsWith(".mp4") ? (
                            <video
                              key={index}
                              src={url}
                              onClick={openModal}
                              className="w-24 h-24 cursor-pointer rounded-md border border-[var(--accent)]"
                            // controls
                            />
                          ) : url.endsWith(".webm") ? (
                            <audio
                              key={index}
                              src={url}
                              className="w-[15vw]"
                              controls
                            />
                          ) : (
                            <img
                              key={index}
                              src={url}
                              onClick={openModal}
                              className="w-24 h-24 rounded cursor-pointer border border-[var(--accent)]"
                            />
                          );
                        })}

                        {(msg.media?.length || 0) > 3 && (
                          <div
                            onClick={() => {
                              setModalMedia(msg.media || []);
                              setCurrentMediaIndex(3);
                              setShowMediaModal(true);
                            }}
                            className="w-24 h-24 flex items-center justify-center bg-[var(--background)] bg-opacity-60 text-[var(--foreground)] rounded cursor-pointer"
                          >
                            +{(msg.media?.length || 0) - 3}
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
                            <img
                              key={i}
                              src={user.profilePic}
                              title={user.username}
                              className="w-4 h-4 rounded-full border border-[var(--accent)]"
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
        <div className="h-[100%] bg-[var(--muted)] p-4 rounded-lg flex items-center justify-center text-[var(--foreground)] text-sm">
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
      {!loadingMessages && showEmoji && (
        <div className="flex relative left-0 top-16">
          <EmojiPicker
            onEmojiClick={(emoji) => setMessageInput((prev) => prev + emoji)}
          />
        </div>
      )}

      {!loadingMessages && (selectedFriend || selectedGroup) && (
        <div className="flex flex-row items-center justify-center mt-4 gap-2">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="upload"
          />
          <label
            htmlFor="upload"
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

          <div
            className="cursor-pointer px-4 py-2 text-[var(--foreground)] hover:bg-[var(--accent)]/15 border-1 border-[var(--accent)] bg-[var(--card)] rounded"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            😀
          </div>

          {/* Disappearing Messages Timer — only for 1-1 chats */}
          {selectedFriend && (
            <div className="relative" ref={timerDropdownRef}>
              <button
                onClick={() => setShowTimerDropdown(!showTimerDropdown)}
                className={`flex items-center gap-1 cursor-pointer px-3 py-2 border-1 rounded transition-all ${disappearDuration > 0
                  ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "border-[var(--accent)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]/15"
                  }`}
                title="Set disappearing timer"
              >
                <Timer size={16} />
                {disappearDuration > 0 && (
                  <span className="text-xs font-semibold">{disappearDuration}h</span>
                )}
                <ChevronDown size={12} />
              </button>

              <AnimatePresence>
                {showTimerDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[var(--card)] border border-[var(--accent)]/30 rounded-xl shadow-2xl py-2 px-1 min-w-[140px] z-50"
                  >
                    <div className="text-[10px] text-[var(--foreground)]/50 px-3 py-1 font-semibold uppercase tracking-wider">
                      Auto-delete after
                    </div>
                    {DISAPPEAR_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setDisappearDuration(opt.value);
                          setShowTimerDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer transition-all flex items-center justify-between ${disappearDuration === opt.value
                          ? "bg-[var(--accent)]/20 text-[var(--accent)] font-semibold"
                          : "text-[var(--foreground)] hover:bg-[var(--accent)]/10"
                          }`}
                      >
                        <span>{opt.value === 0 ? "🚫 Off" : `⏱️ ${opt.label}`}</span>
                        {disappearDuration === opt.value && (
                          <span className="text-[var(--accent)]">✓</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <textarea
            value={messageInput}
            onChange={handleInputChange}
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
          <button
            onClick={sendMessage}
            className="ml-2 bg-[var(--accent)] text-[var(--card-foreground)] px-4 py-2 rounded-md cursor-pointer hover:opacity-90 transition"
          >
            Send
          </button>
        </div>
      )}
      <MediaViewerModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        media={modalMedia}
        initialIndex={currentMediaIndex}
      />
    </div>
  );
}
