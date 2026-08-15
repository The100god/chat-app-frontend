"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import { userIdAtom, friendsAtom } from "../states/States";
import { TogetherRoom, TicTacToeState, TicTacToeComment } from "../states/togetherTypes";
import { getSocket } from "../hooks/useSocket";
import { RotateCcw, Trophy, Sparkles, Users, Circle, XCircle, Handshake, LogOut } from "lucide-react";

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

  const { board, players, currentTurn, winner, winningLine, isDraw, status } = gameState;

  const movesMade = board.some((cell) => cell !== null);

  // Determine user symbol & partner symbol
  const playerSymbol = userId === players.X ? "X" : userId === players.O ? "O" : null;
  const isMyTurn = status === "playing" && playerSymbol && currentTurn === playerSymbol;

  const sessionStats = (userId && (room.sessionStats?.[`tictactoe_${userId}`] || room.sessionStats?.[userId])) || {
    wins: 0,
    losses: 0,
    ties: 0,
    total: 0,
  };

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

  return (
    <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md mx-auto select-none gap-3">
      {/* ─── Top Scoreboard & Logo ─── */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/game-icons/tictactoe.png"
              alt="Tic-Tac-Toe"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg p-0.5 bg-cyan-500/10 border border-cyan-500/30"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
            <div>
              <h2 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider">
                Tic-Tac-Toe
              </h2>
              <p className="text-[10px] text-[var(--foreground)] opacity-60 font-bold">
                {status === "playing" ? (isMyTurn ? "Your Turn!" : "Partner's Turn") : "3x3 Match"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRematch}
              className="p-1.5 rounded-xl bg-[var(--muted)] hover:bg-[var(--accent)] hover:text-white text-[var(--foreground)] transition cursor-pointer"
              title="Reset Game"
            >
              <RotateCcw size={14} />
            </button>
            {onLeave && (
              <button
                onClick={onLeave}
                className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                title="Leave Room"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Live Session Stats */}
        <div className="w-full bg-[var(--muted)]/50 rounded-xl py-1 px-2.5 border border-[var(--border)] flex items-center justify-between text-[10px] font-extrabold text-[var(--foreground)]">
          <span className="flex items-center gap-1 text-emerald-400" title={`${sessionStats.wins} Wins`}>
            <Trophy size={12} /> {sessionStats.wins} <span className="hidden sm:inline">Wins</span>
          </span>
          <span className="flex items-center gap-1 text-rose-400" title={`${sessionStats.losses} Losses`}>
            <XCircle size={12} /> {sessionStats.losses} <span className="hidden sm:inline">Losses</span>
          </span>
          <span className="flex items-center gap-1 text-amber-400" title={`${sessionStats.ties} Ties`}>
            <Handshake size={12} /> {sessionStats.ties} <span className="hidden sm:inline">Ties</span>
          </span>
          <span className="opacity-60" title={`${sessionStats.total} Total Matches`}>
            {sessionStats.total} <span className="hidden sm:inline">Total</span>
          </span>
        </div>
      </div>

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



      {/* ─── Bottom Actions (Rematch / Leave) ─── */}
      <div className="w-full flex items-center justify-center gap-2">
        <button
          onClick={handleRematch}
          title="Rematch"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer"
        >
          <RotateCcw size={14} />
          <span className="hidden sm:inline">Rematch</span>
        </button>

        {onLeave && (
          <button
            onClick={onLeave}
            title="Leave Game"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--muted)] text-[var(--foreground)] text-xs font-medium hover:bg-[var(--border)] transition-colors cursor-pointer"
          >
            <Users size={14} />
            <span className="hidden sm:inline">Leave Game</span>
          </button>
        )}
      </div>
    </div>
  );
}
