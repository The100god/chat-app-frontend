"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTogetherRoom } from "../hooks/useTogetherRoom";
import { useAtom } from "jotai";
import { userIdAtom, friendsAtom } from "../states/States";
import { TogetherGameId } from "../states/togetherTypes";
import {
  LogOut,
  X,
  Copy,
  Check,
  Users,
  Crown,
  Gamepad2,
  Film,
  Music,
  Brain,
  Heart,
  ArrowRightLeft,
} from "lucide-react";

import TicTacToeBoard from "./TicTacToeBoard";
import { RockPaperScissorsBoard } from "./games/RockPaperScissorsBoard";
import { Connect4Board } from "./games/Connect4Board";
import { MemoryMatchBoard } from "./games/MemoryMatchBoard";
import { DrawingBoard } from "./games/DrawingBoard";
import { QuizBoard } from "./games/QuizBoard";
import { ActivityBoard } from "./activities/ActivityBoard";
import { WatchBoard } from "./watch/WatchBoard";
import { ListenBoard } from "./music/ListenBoard";
import { GameSelector } from "./games/GameSelector";

import { getGameDefinition } from "./games/registry";

const typeConfig: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; emoji: string }
> = {
  game: { label: "Game Room", icon: <Gamepad2 size={20} />, color: "#8b5cf6", emoji: "🎮" },
  watch: { label: "Watch Together", icon: <Film size={20} />, color: "#ef4444", emoji: "🎬" },
  music: { label: "Listen Together", icon: <Music size={20} />, color: "#06b6d4", emoji: "🎵" },
  quiz: { label: "Couple Quiz", icon: <Brain size={20} />, color: "#f59e0b", emoji: "🧠" },
  activity: { label: "Activity", icon: <Heart size={20} />, color: "#ec4899", emoji: "❤️" },
};

const TogetherRoomShell: React.FC = () => {
  const { room, isHost, leaveRoom, closeRoom, switchGame, emit } = useTogetherRoom();
  const [userId] = useAtom(userIdAtom);
  const [friends] = useAtom(friendsAtom);
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState<"leave" | "close" | null>(null);
  const [isChangingGame, setIsChangingGame] = useState(false);

  if (!room) return null;

  const gameDef = room.gameId ? getGameDefinition(room.gameId) : undefined;
  const config = typeConfig[room.type] || typeConfig.game;

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(room.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy room ID");
    }
  };

  const handleLeave = () => {
    leaveRoom();
    setShowConfirm(null);
  };

  const handleClose = () => {
    closeRoom();
    setShowConfirm(null);
  };

  const getParticipantName = (pid: string) => {
    if (pid === userId) return "You";
    const friend = friends.find((f) => f.friendId === pid);
    return friend?.username || "User";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center w-full max-w-2xl sm:max-w-3xl mx-auto gap-3 p-2 sm:p-4"
    >
      {/* Compact Room Header */}
      <div
        className="w-full rounded-2xl px-4 py-3 text-white flex items-center justify-between gap-2 shadow-lg"
        style={{ backgroundColor: config.color }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {gameDef ? (
            <img src={gameDef.iconPath} alt={gameDef.title} className="w-7 h-7 object-contain flex-shrink-0" />
          ) : (
            <span className="text-xl flex-shrink-0">{config.emoji}</span>
          )}
          <h2 className="text-sm sm:text-base font-bold truncate">
            {gameDef ? gameDef.title : config.label}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Switch Game Button */}
          {room.type === "game" && (
            <button
              onClick={() => setIsChangingGame(!isChangingGame)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer"
              title="Select a new game in this room"
            >
              <ArrowRightLeft size={13} />
              <span className="hidden sm:inline">{isChangingGame ? "Resume Game" : "Switch Game"}</span>
              <span className="sm:hidden">{isChangingGame ? "Resume" : "Switch"}</span>
            </button>
          )}

          <button
            onClick={handleCopyRoomId}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-2.5 py-1 text-xs transition-colors cursor-pointer"
            title="Click to copy Room ID"
          >
            <span className="font-mono font-medium">{room.roomId}</span>
            {copied ? <Check size={12} /> : <Copy size={12} className="opacity-70" />}
          </button>

          <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 text-xs font-medium">
            <Users size={12} />
            <span>{room.participants.length}</span>
          </div>
        </div>
      </div>

      {/* Game Content Block */}
      {room.type === "game" && (
        <div className="w-full bg-[var(--card)] rounded-2xl border border-[var(--accent)]/30 p-3 sm:p-4 shadow-xl backdrop-blur-md">
          {!room.gameId || isChangingGame ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="text-[var(--accent)]" size={18} />
                  <h3 className="text-sm font-bold text-[var(--foreground)]">
                    {room.gameId ? "Select a New Game for Room" : "Choose a Game to Start Playing!"}
                  </h3>
                </div>
                {room.gameId && (
                  <button
                    onClick={() => setIsChangingGame(false)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--muted)] hover:bg-[var(--accent)] hover:text-white transition cursor-pointer"
                  >
                    Cancel & Resume Current Game
                  </button>
                )}
              </div>
              <GameSelector
                selectedGameId={room.gameId as TogetherGameId | null}
                userStats={room.sessionStats}
                onSelectGame={(newGameId) => {
                  switchGame(newGameId);
                  setIsChangingGame(false);
                }}
              />
            </div>
          ) : (
            <>
              {room.gameId === "tictactoe" && (
                <TicTacToeBoard room={room} onLeave={() => setIsChangingGame(true)} />
              )}
              {room.gameId === "rps" && (
                <RockPaperScissorsBoard
                  room={room}
                  currentUserId={userId || ""}
                  onEmit={emit}
                  onLeaveRoom={() => setIsChangingGame(true)}
                />
              )}
              {room.gameId === "connect4" && (
                <Connect4Board
                  room={room}
                  currentUserId={userId || ""}
                  onEmit={emit}
                  onLeaveRoom={() => setIsChangingGame(true)}
                />
              )}
              {room.gameId === "memory" && (
                <MemoryMatchBoard
                  room={room}
                  currentUserId={userId || ""}
                  onEmit={emit}
                  onLeaveRoom={() => setIsChangingGame(true)}
                />
              )}
              {room.gameId === "drawing" && (
                <DrawingBoard
                  room={room}
                  currentUserId={userId || ""}
                  onEmit={emit}
                  onLeaveRoom={() => setIsChangingGame(true)}
                />
              )}
              {room.gameId === "quiz" && (
                <QuizBoard
                  room={room}
                  currentUserId={userId || ""}
                  onEmit={emit}
                  onLeaveRoom={() => setIsChangingGame(true)}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Activity Content Block */}
      {room.type === "activity" && (
        <ActivityBoard
          room={room}
          currentUserId={userId || ""}
          onEmit={emit}
          onLeaveRoom={leaveRoom}
        />
      )}

      {/* Watch Together Content Block */}
      {room.type === "watch" && (
        <WatchBoard
          room={room}
          currentUserId={userId || ""}
          onEmit={emit}
          onLeaveRoom={leaveRoom}
        />
      )}

      {/* Listen Together (Music) Content Block */}
      {room.type === "music" && (
        <ListenBoard
          room={room}
          currentUserId={userId || ""}
          onEmit={emit}
          onLeaveRoom={leaveRoom}
        />
      )}

      {/* Participants List */}
      <div className="w-full bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
          <Users size={16} />
          Participants
        </h3>
        <div className="flex flex-col gap-2">
          {room.participants.map((pid) => {
            const isCurrentUser = pid === userId;
            const isParticipantHost = pid === room.hostId;
            const name = getParticipantName(pid);

            return (
              <div
                key={pid}
                className="flex items-center justify-between bg-[var(--muted)]/50 rounded-xl px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-bold text-[10px]">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-[var(--foreground)]">
                    {name} {isCurrentUser && "(You)"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isParticipantHost && (
                    <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full px-2 py-0.5 text-[10px] font-medium">
                      <Crown size={10} />
                      Host
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="w-full flex items-center justify-end gap-2 pt-1">
        {isHost ? (
          <button
            onClick={() => setShowConfirm("close")}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer"
          >
            <X size={14} />
            Close Room for All
          </button>
        ) : (
          <button
            onClick={() => setShowConfirm("leave")}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            Leave Room Session
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4"
            >
              <h3 className="text-base font-bold text-[var(--foreground)]">
                {showConfirm === "close" ? "Close Room for Everyone?" : "Leave Room Session?"}
              </h3>
              <p className="text-xs text-[var(--foreground)] opacity-70">
                {showConfirm === "close"
                  ? "This will end the session and disconnect all participants."
                  : "You will leave this room session. You can rejoin if the host keeps it open."}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={showConfirm === "close" ? handleClose : handleLeave}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500 text-white hover:bg-rose-600 transition cursor-pointer"
                >
                  {showConfirm === "close" ? "Close Room" : "Leave"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TogetherRoomShell;
