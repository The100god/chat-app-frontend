"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, RotateCcw, LogOut, MessageSquare, Send, Users, XCircle, Handshake, Gamepad2 } from "lucide-react";
import { Connect4State, GameStats, TogetherRoom } from "../../states/togetherTypes";

interface Connect4BoardProps {
  room: TogetherRoom;
  currentUserId: string;
  onEmit: (event: string, data: any) => void;
  onLeaveRoom: () => void;
}

export const Connect4Board: React.FC<Connect4BoardProps> = ({
  room,
  currentUserId,
  onEmit,
  onLeaveRoom,
}) => {
  const c4State = (room.state.connect4 || {}) as Connect4State;
  const {
    board = Array(6).fill(null).map(() => Array(7).fill(null)),
    players = { R: null, Y: null },
    currentTurn = "R",
    winner = null,
    winningLine = null,
    isDraw = false,
    status = "waiting",
    comments = [],
  } = c4State;

  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(true);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const partnerId = (room.participants || []).find((id) => id !== currentUserId) || "Partner";
  const playerSymbol = currentUserId === players.R ? "R" : currentUserId === players.Y ? "Y" : null;
  const isMyTurn = status === "playing" && currentTurn === playerSymbol;

  const sessionStats: GameStats = room.sessionStats?.[currentUserId] || {
    wins: 0,
    losses: 0,
    ties: 0,
    total: 0,
  };

  const handleDropToken = (colIndex: number) => {
    if (!isMyTurn) return;
    onEmit("together:connect4:dropToken", { roomId: room.roomId, colIndex });
  };

  const handleStartGame = () => {
    onEmit("together:connect4:startGame", { roomId: room.roomId });
  };

  const handleSelectFirstPlayer = (firstPlayerId: string) => {
    onEmit("together:connect4:swapFirstTurn", { roomId: room.roomId, firstPlayerId });
  };

  const handleRestart = () => {
    onEmit("together:connect4:restart", { roomId: room.roomId });
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onEmit("together:tictactoe:comment", { roomId: room.roomId, text: commentInput });
    setCommentInput("");
  };

  const isCellWinning = (r: number, c: number) => {
    if (!winningLine) return false;
    return winningLine.some(([wr, wc]) => wr === r && wc === c);
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 max-w-xl sm:max-w-2xl mx-auto p-2">
      {/* ─── Top Header & Stats Bar ─── */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔴🟡</span>
            <div>
              <h2 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider">
                Connect 4
              </h2>
              <p className="text-[10px] text-[var(--foreground)] opacity-60 font-bold">
                {status === "playing" ? (isMyTurn ? "Your Turn!" : "Partner's Turn") : "4-in-a-Row Duel"}
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
      </div>

      {/* ─── Status Screen / Setup Screen ─── */}
      <AnimatePresence mode="wait">
        {status === "waiting" && (
          <div className="w-full py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <Users size={14} className="animate-bounce" />
            Waiting for a friend to join Connect 4...
          </div>
        )}

        {status === "setup" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--accent)]/40 shadow-xl flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
              <Sparkles size={14} className="text-[var(--accent)] animate-spin" />
              <span>Select Who Plays 1st & Gets 🔴 Red Tokens</span>
            </div>

            {/* Color & Turn Rule Indicator */}
            <div className="w-full py-1.5 px-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[11px] text-center font-medium text-[var(--foreground)] flex items-center justify-center gap-1.5">
              <span>🔴 <strong>Red Tokens</strong> move FIRST</span>
              <span className="opacity-40">•</span>
              <span>🟡 <strong>Yellow Tokens</strong> move SECOND</span>
            </div>

            {/* Current Selected Roles Preview */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-rose-400 uppercase">🔴 Red Token (1st Turn)</span>
                <span className="text-xs font-black text-rose-300 mt-0.5">
                  {players.R === currentUserId ? "You 👤" : "Partner 👥"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-amber-400 uppercase">🟡 Yellow Token (2nd Turn)</span>
                <span className="text-xs font-black text-amber-300 mt-0.5">
                  {players.Y === currentUserId ? "You 👤" : "Partner 👥"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => handleSelectFirstPlayer(currentUserId)}
                className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  players.R === currentUserId
                    ? "bg-rose-500 text-white border-rose-400 shadow-md ring-2 ring-rose-400/50"
                    : "bg-[var(--muted)] text-[var(--foreground)] opacity-70 hover:opacity-100"
                }`}
              >
                🔴 You Play 1st
              </button>
              <button
                onClick={() => handleSelectFirstPlayer(partnerId)}
                className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  players.R === partnerId
                    ? "bg-rose-500 text-white border-rose-400 shadow-md ring-2 ring-rose-400/50"
                    : "bg-[var(--muted)] text-[var(--foreground)] opacity-70 hover:opacity-100"
                }`}
              >
                🔴 Partner Plays 1st
              </button>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow-lg hover:opacity-90 transition cursor-pointer"
            >
              🚀 Launch Connect 4 Board
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Playing Role & Turn Indicator Bar ─── */}
      {(status === "playing" || status === "finished") && (
        <div className="w-full grid grid-cols-2 gap-2 max-w-[380px] sm:max-w-[440px]">
          {/* You */}
          <div className={`p-2 rounded-xl border flex items-center gap-2 transition ${
            isMyTurn
              ? "bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/50 shadow-md"
              : "bg-[var(--card)] border-[var(--border)] opacity-70"
          }`}>
            <span className="text-xl">{playerSymbol === "R" ? "🔴" : "🟡"}</span>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-black text-[var(--foreground)]">
                You ({playerSymbol === "R" ? "Red - 1st" : "Yellow - 2nd"})
              </span>
              <span className={`text-[10px] font-bold ${isMyTurn ? "text-emerald-400 animate-pulse" : "text-[var(--foreground)] opacity-50"}`}>
                {isMyTurn ? "👉 YOUR TURN!" : "Waiting..."}
              </span>
            </div>
          </div>

          {/* Partner */}
          <div className={`p-2 rounded-xl border flex items-center gap-2 transition ${
            !isMyTurn && status === "playing"
              ? "bg-purple-500/15 border-purple-400 ring-2 ring-purple-400/50 shadow-md"
              : "bg-[var(--card)] border-[var(--border)] opacity-70"
          }`}>
            <span className="text-xl">{playerSymbol === "R" ? "🟡" : "🔴"}</span>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-black text-[var(--foreground)]">
                Partner ({playerSymbol === "R" ? "Yellow - 2nd" : "Red - 1st"})
              </span>
              <span className={`text-[10px] font-bold ${!isMyTurn && status === "playing" ? "text-purple-400 animate-pulse" : "text-[var(--foreground)] opacity-50"}`}>
                {!isMyTurn && status === "playing" ? "👉 PARTNER'S TURN" : "Waiting..."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Connect 4 6x7 Grid ─── */}
      {(status === "playing" || status === "finished") && (
        <div className="w-full bg-[var(--card)] border border-[var(--accent)]/40 rounded-3xl p-3 shadow-2xl flex flex-col items-center gap-2">
          {/* Column Drop Buttons Header */}
          <div className="grid grid-cols-7 gap-1.5 w-full max-w-[380px] sm:max-w-[440px]">
            {[0, 1, 2, 3, 4, 5, 6].map((colIdx) => (
              <button
                key={colIdx}
                disabled={!isMyTurn}
                onClick={() => handleDropToken(colIdx)}
                onMouseEnter={() => setHoveredCol(colIdx)}
                onMouseLeave={() => setHoveredCol(null)}
                className={`h-7 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  isMyTurn
                    ? "bg-[var(--accent)]/20 hover:bg-[var(--accent)] text-white shadow-sm"
                    : "opacity-30 cursor-not-allowed bg-[var(--muted)]"
                }`}
              >
                <span className="text-[10px] font-bold">⬇️</span>
              </button>
            ))}
          </div>

          {/* 6x7 Cell Board */}
          <div className="grid grid-cols-7 gap-1.5 w-full max-w-[380px] sm:max-w-[440px] bg-blue-900/40 p-2 rounded-2xl border border-blue-500/30 backdrop-blur-md">
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const isWinning = isCellWinning(rIdx, cIdx);
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => isMyTurn && handleDropToken(cIdx)}
                    className="w-full aspect-square rounded-full bg-slate-900/80 border border-slate-700/50 flex items-center justify-center p-0.5 relative overflow-hidden cursor-pointer"
                  >
                    {cell && (
                      <motion.div
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`w-full h-full rounded-full shadow-inner ${
                          cell === "R"
                            ? "bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-400 border border-rose-300"
                            : "bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 border border-yellow-200"
                        } ${isWinning ? "ring-4 ring-white animate-pulse" : ""}`}
                      />
                    )}
                  </div>
                );
              })
            )}
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
                  {winner ? (winner === playerSymbol ? "You Won! 🎉" : "Partner Won!") : "It's a Tie! 🤝"}
                </h3>
                <p className="text-xs text-[var(--foreground)] opacity-70 mt-1 font-medium">
                  Great match! What would you like to do next?
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
