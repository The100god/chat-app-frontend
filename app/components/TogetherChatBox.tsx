"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Smile, CheckCheck, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

export interface TogetherComment {
  id: string;
  senderId?: string;
  username?: string;
  text: string;
  timestamp: number;
}

interface TogetherChatBoxProps {
  comments: TogetherComment[];
  currentUserId: string;
  hostId: string;
  onSendMessage: (text: string) => void;
  title?: string;
  accentColor?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const QUICK_REACTIONS = [
  "🔥 Wow",
  "😂 Haha",
  "❤️ Love it",
  "😱 Omg",
  "👏 Bravo",
  "🎉 Yay",
  "💯 100",
  "✨ Perfect",
];

const FLOATING_EMOJIS = ["💬", "✨", "❤️", "🔥", "🎉", "👍", "😍", "🎶", "🟢", "⭐"];

export const TogetherChatBox: React.FC<TogetherChatBoxProps> = ({
  comments = [],
  currentUserId,
  hostId,
  onSendMessage,
  title = "Together Live Chat",
  accentColor = "var(--accent)",
  collapsible = false,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentsContainerRef = useRef<HTMLDivElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const prevLength = useRef(comments.length);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (comments.length > prevLength.current) {
      const container = commentsContainerRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    }
    prevLength.current = comments.length;
  }, [comments.length]);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleSend = (overrideText?: string) => {
    const text = overrideText || inputText;
    if (!text.trim()) return;
    onSendMessage(text.trim());
    if (!overrideText) {
      setInputText("");
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInputText((prev) => prev + emojiData.emoji);
  };

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden flex flex-col relative transition-all duration-200">
      {/* WhatsApp Style Together Chat Header */}
      <div
        className="w-full px-4 py-3 bg-[var(--muted)]/60 border-b border-[var(--border)] flex items-center justify-between gap-2 select-none cursor-pointer"
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm font-bold text-xs flex-shrink-0"
            style={{ backgroundColor: accentColor.startsWith("var") ? "var(--accent)" : accentColor }}
          >
            <MessageSquare size={16} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[var(--foreground)] truncate flex items-center gap-1.5">
              <span>{title}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            </h4>
            <p className="text-[10px] text-[var(--foreground)] opacity-60 truncate">
              Live Chat • {comments.length} message{comments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 hidden sm:inline-block">
            Synced Real-time
          </span>
          {collapsible && (
            <button className="p-1 text-[var(--foreground)] opacity-70 hover:opacity-100 transition">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {(!collapsible || isExpanded) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col w-full"
          >
            {/* Quick Reactions Bar */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--muted)]/20 border-b border-[var(--border)]/40 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-bold text-[var(--foreground)] opacity-50 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
                <Sparkles size={11} className="text-[var(--accent)]" /> Quick:
              </span>
              {QUICK_REACTIONS.map((emojiText) => (
                <button
                  key={emojiText}
                  type="button"
                  onClick={() => handleSend(emojiText)}
                  className="px-2.5 py-1 rounded-full bg-[var(--card)] hover:bg-[var(--accent)]/15 border border-[var(--border)] hover:border-[var(--accent)]/40 text-[11px] font-semibold text-[var(--foreground)] transition-all cursor-pointer flex-shrink-0 active:scale-95 shadow-xs"
                >
                  {emojiText}
                </button>
              ))}
            </div>

            {/* Conversation Bubbles Container with Floating Animated Emoji Background */}
            <div className="relative w-full min-h-[160px] max-h-[260px] bg-[var(--background)] overflow-hidden flex flex-col">
              {/* Subtle Floating Animated Emojis in Background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                {FLOATING_EMOJIS.map((emoji, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: "100%", x: `${(idx * 20) % 90}%`, opacity: 0.2 }}
                    animate={{
                      y: ["100%", "-20%"],
                      opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                      duration: 8 + (idx % 5) * 2,
                      repeat: Infinity,
                      ease: "linear",
                      delay: idx * 0.8,
                    }}
                    className="absolute text-xl select-none"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>

              {/* Speech Bubbles Stream */}
              <div
                ref={commentsContainerRef}
                className="relative z-10 flex flex-col gap-2 p-3 overflow-y-auto flex-1 scrollbar-thin"
              >
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center my-auto py-6 text-center text-[var(--foreground)] opacity-50">
                    <MessageSquare size={24} className="mb-1 text-[var(--accent)] opacity-70 animate-bounce" />
                    <p className="text-xs font-medium">No messages in room yet.</p>
                    <p className="text-[11px]">Say hi or tap a quick reaction below!</p>
                  </div>
                ) : (
                  comments.map((c) => {
                    const isCurrentUser =
                      (c.senderId && c.senderId === currentUserId) ||
                      c.username === "You" ||
                      c.username === currentUserId ||
                      (c.username === "Host" && currentUserId === hostId) ||
                      (c.username === "Partner" && currentUserId !== hostId);

                    return (
                      <div
                        key={c.id}
                        className={`flex flex-col max-w-[82%] sm:max-w-[75%] ${isCurrentUser ? "self-end items-end" : "self-start items-start"
                          }`}
                      >
                        <div
                          className={`relative rounded-2xl px-3.5 py-2 text-xs shadow-xs transition-all ${isCurrentUser
                              ? "whatsapp-bubble-sent bg-[var(--bubble-sent)] text-[var(--bubble-sent-foreground)] rounded-tr-xs border border-emerald-500/20"
                              : "whatsapp-bubble-received bg-[var(--bubble-received)] text-[var(--bubble-received-foreground)] rounded-tl-xs border border-[var(--border)]"
                            }`}
                        >
                          {/* Sender name for received messages */}
                          {!isCurrentUser && (
                            <span className="block text-[11px] font-bold text-[var(--accent)] mb-0.5">
                              {c.username || "User"}
                            </span>
                          )}

                          {/* Message Content */}
                          <p className="whitespace-pre-wrap break-words leading-relaxed font-normal">
                            {c.text}
                          </p>

                          {/* Timestamp & Read Indicator Footer */}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${isCurrentUser
                                ? "text-[var(--bubble-sent-foreground)] opacity-70"
                                : "text-[var(--foreground)] opacity-50"
                              }`}
                          >
                            <span>{formatTime(c.timestamp)}</span>
                            {isCurrentUser && (
                              <CheckCheck size={13} className="text-sky-400 font-bold" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* WhatsApp Input Bar */}
            <div className="relative p-2 sm:p-2.5 bg-[var(--muted)]/50 border-t border-[var(--border)] flex items-center gap-2">
              {/* Emoji Picker Popover */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    ref={pickerRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-2 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[var(--border)]"
                  >
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme={Theme.AUTO}
                      width={300}
                      height={350}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emoji Toggle Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-full text-[var(--foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--card)] transition cursor-pointer flex-shrink-0 ${showEmojiPicker ? "text-[var(--accent)] opacity-100" : ""
                  }`}
                title="Choose Emoji"
              >
                <Smile size={20} />
              </button>

              {/* Text Input Field */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a WhatsApp message..."
                className="flex-1 px-4 py-2 rounded-2xl bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] text-xs outline-none focus:ring-2 focus:ring-[var(--accent)] transition placeholder:text-[var(--foreground)]/40"
              />

              {/* WhatsApp Green Send Arrow Button */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="w-9 h-9 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white flex items-center justify-center shadow-md transition-all cursor-pointer disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
                title="Send Message"
              >
                <Send size={15} className="ml-0.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
