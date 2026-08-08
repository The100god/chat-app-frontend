"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, RotateCcw, LogOut, MessageSquare, Send, XCircle, Handshake, Users, Gamepad2 } from "lucide-react";
import { MemoryMatchState, GameStats, TogetherRoom } from "../../states/togetherTypes";

interface MemoryMatchBoardProps {
  room: TogetherRoom;
  currentUserId: string;
  onEmit: (event: string, data: any) => void;
  onLeaveRoom: () => void;
}

export const MemoryMatchBoard: React.FC<MemoryMatchBoardProps> = ({
  room,
  currentUserId,
  onEmit,
  onLeaveRoom,
}) => {
  const mmState = (room.state.memoryMatch || {}) as MemoryMatchState;
  const {
    cards = [],
    scores = {},
    currentTurn = null,
    flippedCards = [],
    winner = null,
    status = "waiting",
    comments = [],
  } = mmState;

  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(true);

  const isMyTurn = currentTurn === currentUserId;
  const participants = room.participants || [];
  const partnerId = participants.find((id) => id !== currentUserId) || "Partner";

  const myScore = scores[currentUserId] || 0;
  const partnerScore = scores[partnerId] || 0;

  const sessionStats: GameStats = room.sessionStats?.[currentUserId] || {
    wins: 0,
    losses: 0,
    ties: 0,
    total: 0,
  };

  // Auto flip back un-matched cards after 1.2s delay if 2 cards flipped
  useEffect(() => {
    if (flippedCards.length === 2) {
      const timer = setTimeout(() => {
        onEmit("together:memory:resetFlipped", { roomId: room.roomId });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [flippedCards, room.roomId, onEmit]);

  const handleCardClick = (cardIndex: number) => {
    if (!isMyTurn || flippedCards.length >= 2) return;
    onEmit("together:memory:flipCard", { roomId: room.roomId, cardIndex });
  };

  const handleStartGame = () => {
    onEmit("together:memory:startGame", { roomId: room.roomId });
  };

  const handleSelectFirstPlayer = (firstPlayerId: string) => {
    onEmit("together:memory:swapFirstTurn", { roomId: room.roomId, firstPlayerId });
  };

  const handleRestart = () => {
    onEmit("together:memory:restart", { roomId: room.roomId });
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onEmit("together:tictactoe:comment", { roomId: room.roomId, text: commentInput });
    setCommentInput("");
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 max-w-xl sm:max-w-2xl mx-auto p-2">
      {/* ─── Header & Stats Bar ─── */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎴🧠</span>
            <div>
              <h2 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider">
                Memory Match
              </h2>
              <p className="text-[10px] text-[var(--foreground)] opacity-60 font-bold">
                {status === "playing" ? (isMyTurn ? "Your Turn to Flip!" : "Partner's Turn") : "Memory Challenge"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="p-1.5 rounded-xl bg-[var(--muted)] hover:bg-[var(--accent)] hover:text-white text-[var(--foreground)] transition cursor-pointer"
              title="Reset Game"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onLeaveRoom}
              className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer"
              title="Leave Room"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Live Session Stats */}
        <div className="w-full bg-[var(--muted)]/50 rounded-xl py-1 px-2.5 border border-[var(--border)] flex items-center justify-between text-[10px] font-extrabold text-[var(--foreground)]">
          <span className="flex items-center gap-1 text-emerald-400">
            <Trophy size={11} /> {sessionStats.wins} Wins
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <XCircle size={11} /> {sessionStats.losses} Losses
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <Handshake size={11} /> {sessionStats.ties} Ties
          </span>
          <span className="opacity-60">{sessionStats.total} Total</span>
        </div>

        {/* Score Counters */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="flex flex-col items-center p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <span className="text-[10px] font-bold text-purple-400 uppercase">Your Pairs</span>
            <span className="text-xl font-black text-purple-300">{myScore}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
            <span className="text-[10px] font-bold text-indigo-400 uppercase">Partner Pairs</span>
            <span className="text-xl font-black text-indigo-300">{partnerScore}</span>
          </div>
        </div>
      </div>

      {/* ─── Status Screen / Setup Screen ─── */}
      <AnimatePresence mode="wait">
        {status === "waiting" && (
          <div className="w-full py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <Users size={14} className="animate-bounce" />
            Waiting for a friend to join Memory Match...
          </div>
        )}

        {status === "setup" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-3 rounded-2xl bg-[var(--card)] border border-[var(--accent)]/40 shadow-xl flex flex-col items-center gap-2.5"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
              <Sparkles size={14} className="text-[var(--accent)] animate-spin" />
              <span>Who Flips First? Select & Start</span>
            </div>
            <div className="flex items-center gap-1.5 w-full">
              <button
                onClick={() => handleSelectFirstPlayer(currentUserId)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                  currentTurn === currentUserId
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-[var(--muted)] text-[var(--foreground)] opacity-70"
                }`}
              >
                👤 You First
              </button>
              <button
                onClick={() => handleSelectFirstPlayer(partnerId)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                  currentTurn === partnerId
                    ? "bg-purple-600 text-white border-purple-500"
                    : "bg-[var(--muted)] text-[var(--foreground)] opacity-70"
                }`}
              >
                👥 Partner First
              </button>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow cursor-pointer"
            >
              🚀 Launch Memory Match Board
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 4x4 Cards Grid ─── */}
      {(status === "playing" || status === "finished") && (
        <div className="w-full bg-[var(--card)] border border-[var(--accent)]/40 rounded-3xl p-3.5 shadow-2xl flex flex-col items-center">
          <div className="grid grid-cols-4 gap-2.5 w-full max-w-[380px] sm:max-w-[440px]">
            {cards.map((card, idx) => {
              const isFlipped = card.isFlipped || card.isMatched;
              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: isFlipped ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(idx)}
                  className={`w-full aspect-square rounded-2xl border-2 flex items-center justify-center text-2xl font-black shadow-md transition-all cursor-pointer ${
                    card.isMatched
                      ? "bg-emerald-500/20 border-emerald-400 opacity-60"
                      : isFlipped
                      ? "bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border-purple-400"
                      : "bg-[var(--muted)] border-[var(--border)] hover:border-[var(--accent)]"
                  }`}
                >
                  {isFlipped ? card.emoji : "❓"}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Game Over Popup Modal ─── */}
      <AnimatePresence>
        {status === "finished" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-3xl shadow-inner">
                {winner ? "🏆" : "🤝"}
              </div>

              <div>
                <h3 className="text-lg font-black text-[var(--foreground)]">
                  {winner ? (winner === currentUserId ? "You Won! 🎉" : "Partner Won!") : "It's a Tie! 🤝"}
                </h3>
                <p className="text-xs text-[var(--foreground)] opacity-70 mt-1 font-medium">
                  Great Memory Match! What would you like to do next?
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full pt-1">
                <button
                  onClick={handleRestart}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow hover:opacity-90 transition cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Rematch Game
                </button>
                <button
                  onClick={onLeaveRoom}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--accent)] text-white font-bold text-xs shadow hover:opacity-90 transition cursor-pointer"
                >
                  <Gamepad2 size={14} />
                  Switch Game
                </button>
                <button
                  onClick={onLeaveRoom}
                  className="w-full py-2 px-4 rounded-xl bg-[var(--muted)] text-[var(--foreground)] opacity-70 hover:opacity-100 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel / Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Live Comments ─── */}
      <div className="w-full bg-[var(--muted)]/50 rounded-2xl border border-[var(--border)] p-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5 opacity-80">
            <MessageSquare size={13} /> Live Comments
          </span>
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-[10px] text-[var(--accent)] font-semibold hover:underline cursor-pointer"
          >
            {showComments ? "Hide" : "Show"} ({comments.length})
          </button>
        </div>

        {showComments && (
          <>
            <div className="max-h-24 overflow-y-auto flex flex-col gap-1.5 p-1 no-scrollbar">
              {comments.length === 0 ? (
                <p className="text-[11px] text-[var(--foreground)] opacity-50 italic text-center py-2">
                  No comments yet. Send a quick chant!
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className={`text-[11px] p-1.5 rounded-xl max-w-[85%] font-medium ${
                      c.senderId === currentUserId
                        ? "bg-[var(--accent)] text-white self-end"
                        : "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] self-start"
                    }`}
                  >
                    {c.text}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendComment} className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Say something nice..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition cursor-pointer"
              >
                <Send size={12} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
