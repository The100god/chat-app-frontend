"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import { userIdAtom, friendsAtom } from "../states/States";
import { TogetherRoom, TicTacToeState, TicTacToeComment } from "../states/togetherTypes";
import { getSocket } from "../hooks/useSocket";
import { RotateCcw, Trophy, Sparkles, Users, Circle, Send, MessageSquare } from "lucide-react";

interface TicTacToeBoardProps {
  room: TogetherRoom;
  onLeave?: () => void;
}

const QUICK_REACTIONS = [
  "🔥 Nice!",
  "😅 Oops!",
  "🎯 GG",
  "⏳ Your turn!",
  "🧠 Mind games",
];

export default function TicTacToeBoard({ room, onLeave }: TicTacToeBoardProps) {
  const [userId] = useAtom(userIdAtom);
  const [friends] = useAtom(friendsAtom);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(true);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const gameState: TicTacToeState = room.state?.ticTacToe || {
    board: Array(9).fill(null),
    players: { X: room.hostId, O: room.participants.find((p) => p !== room.hostId) || null },
    currentTurn: "X",
    winner: null,
    winningLine: null,
    isDraw: false,
    status: room.participants.length >= 2 ? "playing" : "waiting",
    comments: [],
  };

  const { board, players, currentTurn, winner, winningLine, isDraw, status, comments = [] } = gameState;

  const movesMade = board.some((cell) => cell !== null);

  // Determine user symbol & partner symbol
  const playerSymbol = userId === players.X ? "X" : userId === players.O ? "O" : null;
  const isMyTurn = status === "playing" && playerSymbol && currentTurn === playerSymbol;

  // Auto-scroll comments to bottom
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Helper to resolve player info
  const getPlayerInfo = (pid: string | null | undefined) => {
    if (!pid) return { name: "Waiting...", avatar: null, isSelf: false };
    if (pid === userId) return { name: "You", avatar: null, isSelf: true };
    const friend = friends.find((f) => f.friendId === pid);
    return {
      name: friend?.username || "Partner",
      avatar: friend?.profilePic || null,
      isSelf: false,
    };
  };

  const xPlayerInfo = getPlayerInfo(players.X);
  const oPlayerInfo = getPlayerInfo(players.O);

  const handleCellClick = (index: number) => {
    if (!isMyTurn || board[index] !== null) return;
    const socket = getSocket();
    if (socket) {
      socket.emit("together:tictactoe:move", { roomId: room.roomId, cellIndex: index });
    }
  };

  const handleRematch = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit("together:tictactoe:restart", { roomId: room.roomId });
    }
  };

  const handleSelectFirstPlayer = (targetFirstId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit("together:tictactoe:swapFirstTurn", {
        roomId: room.roomId,
        firstPlayerId: targetFirstId,
      });
    }
  };

  const handleStartGame = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit("together:tictactoe:startGame", { roomId: room.roomId });
    }
  };

  const handleSendComment = (textToSend?: string) => {
    const message = textToSend || commentText;
    if (!message.trim()) return;

    const socket = getSocket();
    if (socket) {
      socket.emit("together:tictactoe:comment", { roomId: room.roomId, text: message.trim() });
      if (!textToSend) setCommentText("");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md mx-auto select-none gap-3">
      {/* ─── Header / Player Cards ─── */}
      <div className="w-full grid grid-cols-2 gap-2">
        {/* Player X Card */}
        <motion.div
          animate={
            currentTurn === "X" && (status === "playing" || status === "setup")
              ? { scale: [1, 1.01, 1], borderColor: ["rgba(6,182,212,0.4)", "rgba(6,182,212,1)", "rgba(6,182,212,0.4)"] }
              : { scale: 1 }
          }
          transition={{ duration: 2, repeat: Infinity }}
          className={`relative flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all ${
            currentTurn === "X" && (status === "playing" || status === "setup")
              ? "bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/20"
              : "bg-[var(--card)] border-[var(--border)] opacity-75"
          }`}
        >
          <div className="relative flex-shrink-0">
            {xPlayerInfo.avatar ? (
              <img
                src={xPlayerInfo.avatar}
                alt={xPlayerInfo.name}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-cyan-400/50"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-xs shadow">
                {xPlayerInfo.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-cyan-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
              X
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[var(--foreground)] truncate">
              {xPlayerInfo.name} {xPlayerInfo.isSelf && "(You)"}
            </p>
            <p className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
              {currentTurn === "X" && status === "playing" ? (
                <span className="flex items-center gap-1 animate-pulse">
                  <Circle size={6} fill="#06b6d4" /> Turn
                </span>
              ) : currentTurn === "X" && status === "setup" ? (
                <span className="text-cyan-400 font-bold">Plays 1st (X)</span>
              ) : (
                <span className="opacity-60">Symbol X</span>
              )}
            </p>
          </div>
        </motion.div>

        {/* Player O Card */}
        <motion.div
          animate={
            currentTurn === "O" && (status === "playing" || status === "setup")
              ? { scale: [1, 1.01, 1], borderColor: ["rgba(244,63,94,0.4)", "rgba(244,63,94,1)", "rgba(244,63,94,0.4)"] }
              : { scale: 1 }
          }
          transition={{ duration: 2, repeat: Infinity }}
          className={`relative flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all ${
            currentTurn === "O" && (status === "playing" || status === "setup")
              ? "bg-rose-500/10 border-rose-400 shadow-md shadow-rose-500/20"
              : "bg-[var(--card)] border-[var(--border)] opacity-75"
          }`}
        >
          <div className="relative flex-shrink-0">
            {oPlayerInfo.avatar ? (
              <img
                src={oPlayerInfo.avatar}
                alt={oPlayerInfo.name}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-rose-400/50"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-extrabold text-xs shadow">
                {oPlayerInfo.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
              O
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[var(--foreground)] truncate">
              {oPlayerInfo.name} {oPlayerInfo.isSelf && "(You)"}
            </p>
            <p className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
              {currentTurn === "O" && status === "playing" ? (
                <span className="flex items-center gap-1 animate-pulse">
                  <Circle size={6} fill="#f43f5e" /> Turn
                </span>
              ) : currentTurn === "O" && status === "setup" ? (
                <span className="text-rose-400 font-bold">Plays 2nd (O)</span>
              ) : (
                <span className="opacity-60">Symbol O</span>
              )}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── Status Banner & Setup Screen ─── */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {status === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold text-center shadow-sm"
            >
              <Users size={14} className="animate-bounce" />
              Waiting for a friend to join the room...
            </motion.div>
          )}

          {status === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-2.5 p-3 rounded-2xl bg-[var(--card)] border border-[var(--accent)]/40 shadow-xl"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
                <Sparkles size={14} className="text-[var(--accent)] animate-spin" />
                <span>Who Plays First? Select & Start</span>
              </div>
              <p className="text-[11px] text-[var(--foreground)] opacity-60 text-center">
                Ask in live comments below or choose turn order before launching the game!
              </p>

              {/* Turn Order Buttons */}
              <div className="flex items-center gap-1.5 w-full">
                <button
                  type="button"
                  onClick={() => handleSelectFirstPlayer(players.X!)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    currentTurn === "X"
                      ? "bg-cyan-500 text-white border-cyan-400 shadow-sm scale-[1.02]"
                      : "bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)] opacity-70 hover:opacity-100"
                  }`}
                >
                  <span>{xPlayerInfo.name} 1st (X)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFirstPlayer(players.O!)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    currentTurn === "O"
                      ? "bg-rose-500 text-white border-rose-400 shadow-sm scale-[1.02]"
                      : "bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)] opacity-70 hover:opacity-100"
                  }`}
                >
                  <span>{oPlayerInfo.name} 1st (X)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFirstPlayer("random")}
                  className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] opacity-80 hover:opacity-100 cursor-pointer hover:border-[var(--accent)]"
                  title="Randomize turn order"
                >
                  🎲 Random
                </button>
              </div>

              {/* Launch Game Button */}
              <button
                type="button"
                onClick={handleStartGame}
                className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow-md hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 mt-1"
              >
                <span>🚀 Start Game Interface</span>
              </button>
            </motion.div>
          )}

          {status === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border text-xs font-bold text-center shadow-sm ${
                isMyTurn
                  ? "bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 border-emerald-400/50 text-emerald-400"
                  : "bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)] opacity-80"
              }`}
            >
              {isMyTurn ? (
                <>
                  <Sparkles size={14} className="animate-spin text-emerald-400" />
                  <span>It's Your Turn! Tap an empty cell</span>
                </>
              ) : (
                <span>Waiting for partner's move...</span>
              )}
            </motion.div>
          )}

          {status === "finished" && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-center shadow-lg ${
                winner && winner === playerSymbol
                  ? "bg-gradient-to-br from-amber-500/20 via-emerald-500/20 to-teal-500/20 border-amber-400 text-amber-300"
                  : winner
                  ? "bg-rose-500/15 border-rose-400/50 text-rose-300"
                  : "bg-purple-500/15 border-purple-400/50 text-purple-300"
              }`}
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold">
                {winner && winner === playerSymbol ? (
                  <>
                    <Trophy size={16} className="text-amber-400 animate-bounce" />
                    <span>🎉 Victory! You Won!</span>
                  </>
                ) : winner ? (
                  <>
                    <span>💔 Partner Won! Better luck next time</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-purple-400" />
                    <span>🤝 Good Game! It's a Draw!</span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── 3x3 Animated Board (Only visible during playing or finished) ─── */}
      {(status === "playing" || status === "finished") && (
        <div className="relative w-full aspect-square max-w-[270px] sm:max-w-[310px] p-2.5 rounded-2xl bg-[var(--card)] border border-[var(--accent)]/30 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full h-full">
          {board.map((cellValue, idx) => {
            const isWinningCell = winningLine?.includes(idx);
            const canClick = isMyTurn && cellValue === null;

            return (
              <motion.button
                key={idx}
                type="button"
                onClick={() => handleCellClick(idx)}
                onMouseEnter={() => setHoveredCell(idx)}
                onMouseLeave={() => setHoveredCell(null)}
                whileHover={canClick ? { scale: 1.05 } : {}}
                whileTap={canClick ? { scale: 0.95 } : {}}
                className={`relative flex items-center justify-center rounded-xl border transition-all cursor-pointer overflow-hidden ${
                  isWinningCell
                    ? "bg-gradient-to-br from-amber-500/30 to-emerald-500/30 border-amber-400 shadow-lg shadow-amber-500/30 animate-pulse"
                    : cellValue === "X"
                    ? "bg-cyan-500/10 border-cyan-500/40"
                    : cellValue === "O"
                    ? "bg-rose-500/10 border-rose-500/40"
                    : canClick && hoveredCell === idx
                    ? "bg-[var(--accent)]/15 border-[var(--accent)]/50"
                    : "bg-[var(--muted)] border-[var(--border)] hover:border-[var(--accent)]/30"
                } ${!canClick ? "cursor-default" : ""}`}
              >
                {/* Render Symbol X */}
                {cellValue === "X" && (
                  <motion.svg
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </motion.svg>
                )}

                {/* Render Symbol O */}
                {cellValue === "O" && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="8" />
                  </motion.svg>
                )}

                {/* Hover Ghost Icon */}
                {canClick && hoveredCell === idx && cellValue === null && (
                  <span className="text-lg font-bold opacity-30 text-[var(--accent)]">
                    {playerSymbol}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      )}

      {/* ─── In-Game Comments & Live Chat ─── */}
      <div className="w-full bg-[var(--muted)]/50 rounded-xl border border-[var(--border)] p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-[var(--foreground)] flex items-center gap-1.5 opacity-80">
            <MessageSquare size={12} /> Live Comments
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
            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="max-h-24 overflow-y-auto flex flex-col gap-1.5 px-1 py-0.5 scrollbar-thin">
                {comments.map((c: TicTacToeComment) => {
                  const isMe = c.senderId === userId;
                  const senderName = isMe ? "You" : friends.find((f) => f.friendId === c.senderId)?.username || "Partner";

                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col text-xs rounded-lg px-2.5 py-1 max-w-[85%] ${
                        isMe
                          ? "ml-auto bg-[var(--accent)] text-white font-medium shadow-sm"
                          : "mr-auto bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
                      }`}
                    >
                      <span className="text-[9px] opacity-75 font-semibold">
                        {senderName}
                      </span>
                      <span>{c.text}</span>
                    </motion.div>
                  );
                })}
                <div ref={commentsEndRef} />
              </div>
            ) : (
              <p className="text-[11px] text-[var(--foreground)] opacity-50 text-center py-1 italic">
                No comments yet. Send a quick reaction!
              </p>
            )}

            {/* Quick Reactions Pills */}
            <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
              {QUICK_REACTIONS.map((rx, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendComment(rx)}
                  className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  {rx}
                </button>
              ))}
            </div>

            {/* Comment Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendComment();
              }}
              className="flex items-center gap-1.5 pt-0.5"
            >
              <input
                type="text"
                placeholder="Type a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={100}
                className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-lg px-2.5 py-1 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="bg-[var(--accent)] disabled:opacity-40 text-white p-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0"
              >
                <Send size={12} />
              </button>
            </form>
          </>
        )}
      </div>

      {/* ─── Bottom Actions (Rematch / Leave) ─── */}
      <div className="w-full flex items-center justify-center gap-2">
        <button
          onClick={handleRematch}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer"
        >
          <RotateCcw size={14} />
          Rematch
        </button>

        {onLeave && (
          <button
            onClick={onLeave}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--muted)] text-[var(--foreground)] text-xs font-medium hover:bg-[var(--border)] transition-colors cursor-pointer"
          >
            Leave Game
          </button>
        )}
      </div>
    </div>
  );
}
