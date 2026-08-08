"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, RotateCcw, LogOut, MessageSquare, Send, XCircle, Handshake } from "lucide-react";
import { RPSState, GameStats, TogetherRoom } from "../../states/togetherTypes";

interface RockPaperScissorsBoardProps {
  room: TogetherRoom;
  currentUserId: string;
  onEmit: (event: string, data: any) => void;
  onLeaveRoom: () => void;
}

export const RockPaperScissorsBoard: React.FC<RockPaperScissorsBoardProps> = ({
  room,
  currentUserId,
  onEmit,
  onLeaveRoom,
}) => {
  const rpsState = (room.state.rps || {}) as RPSState;
  const {
    playerChoices = {},
    scores = {},
    round = 1,
    status = "waiting",
    roundResult,
    comments = [],
  } = rpsState;

  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(true);

  const participants = room.participants || [];
  const partnerId = participants.find((id) => id !== currentUserId) || "Partner";

  const myChoice = playerChoices[currentUserId];
  const partnerChoice = playerChoices[partnerId];
  const hasMyChoice = !!myChoice;
  const hasPartnerChoice = !!partnerChoice;

  const myScore = scores[currentUserId] || 0;
  const partnerScore = scores[partnerId] || 0;

  const sessionStats: GameStats = room.sessionStats?.[currentUserId] || {
    wins: 0,
    losses: 0,
    ties: 0,
    total: 0,
  };

  const handleSelectChoice = (choice: "rock" | "paper" | "scissors") => {
    if (status === "round_ended") return;
    onEmit("together:rps:choice", { roomId: room.roomId, choice });
  };

  const handleNextRound = () => {
    onEmit("together:rps:nextRound", { roomId: room.roomId });
  };

  const handleRestart = () => {
    onEmit("together:rps:restart", { roomId: room.roomId });
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onEmit("together:tictactoe:comment", { roomId: room.roomId, text: commentInput });
    setCommentInput("");
  };

  const getChoiceEmoji = (choice?: string | null) => {
    if (choice === "rock") return "🪨";
    if (choice === "paper") return "📄";
    if (choice === "scissors") return "✂️";
    return "❓";
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 max-w-xl sm:max-w-2xl mx-auto p-2">
      {/* ─── Top Scoreboard & Stats ─── */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✂️🪨</span>
            <div>
              <h2 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider">
                Rock Paper Scissors
              </h2>
              <p className="text-[10px] text-[var(--foreground)] opacity-60 font-bold">
                Round {round}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="p-1.5 rounded-xl bg-[var(--muted)] hover:bg-[var(--accent)] hover:text-white text-[var(--foreground)] transition cursor-pointer"
              title="Reset Match"
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

        {/* Live Session Stats Badge */}
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

        {/* Player Score Counter */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="flex flex-col items-center p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <span className="text-[10px] font-bold text-cyan-400 uppercase">You</span>
            <span className="text-xl font-black text-cyan-300">{myScore}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <span className="text-[10px] font-bold text-rose-400 uppercase">Partner</span>
            <span className="text-xl font-black text-rose-300">{partnerScore}</span>
          </div>
        </div>
      </div>

      {/* ─── Battle Stage / Secret Choice Reveal ─── */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-xl flex flex-col items-center justify-center gap-4 relative overflow-hidden">
        <div className="flex items-center justify-around w-full max-w-xs">
          {/* My Card */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--foreground)] opacity-70">Your Move</span>
            <motion.div
              animate={{ scale: hasMyChoice ? 1.05 : 1 }}
              className={`w-20 h-28 rounded-2xl border-2 flex flex-col items-center justify-center text-3xl shadow-lg transition-all ${
                hasMyChoice
                  ? "bg-gradient-to-b from-cyan-500/20 to-cyan-500/40 border-cyan-400 text-cyan-300"
                  : "bg-[var(--muted)] border-dashed border-[var(--border)] text-gray-400"
              }`}
            >
              {hasMyChoice ? getChoiceEmoji(myChoice) : "❓"}
            </motion.div>
          </div>

          <span className="text-xs font-black text-[var(--accent)] opacity-40">VS</span>

          {/* Partner Card */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--foreground)] opacity-70">Partner</span>
            <motion.div
              animate={{ scale: hasPartnerChoice ? 1.05 : 1 }}
              className={`w-20 h-28 rounded-2xl border-2 flex flex-col items-center justify-center text-3xl shadow-lg transition-all ${
                status === "round_ended"
                  ? "bg-gradient-to-b from-rose-500/20 to-rose-500/40 border-rose-400 text-rose-300"
                  : hasPartnerChoice
                  ? "bg-purple-500/20 border-purple-400 text-purple-300"
                  : "bg-[var(--muted)] border-dashed border-[var(--border)] text-gray-400"
              }`}
            >
              {status === "round_ended" ? (
                getChoiceEmoji(partnerChoice)
              ) : hasPartnerChoice ? (
                <span className="text-xs font-bold text-purple-300 animate-pulse">Locked 🔒</span>
              ) : (
                "❓"
              )}
            </motion.div>
          </div>
        </div>

        {/* Round Result Banner */}
        <AnimatePresence>
          {status === "round_ended" && roundResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-1.5 w-full bg-[var(--muted)] p-2.5 rounded-xl border border-[var(--border)]"
            >
              <div className="flex items-center gap-1.5 text-xs font-black">
                {roundResult.isDraw ? (
                  <span className="text-amber-400">🤝 Round Draw! ({roundResult.reason})</span>
                ) : roundResult.winnerId === currentUserId ? (
                  <span className="text-emerald-400">🎉 You Won the Round! ({roundResult.reason})</span>
                ) : (
                  <span className="text-rose-400">💔 Partner Won! ({roundResult.reason})</span>
                )}
              </div>
              <button
                onClick={handleNextRound}
                className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black shadow transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={12} /> Next Round
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Choice Selection Buttons ─── */}
      {status !== "round_ended" && (
        <div className="w-full flex items-center justify-center gap-2">
          {[
            { id: "rock", label: "Rock", icon: "🪨", color: "hover:border-cyan-400" },
            { id: "paper", label: "Paper", icon: "📄", color: "hover:border-emerald-400" },
            { id: "scissors", label: "Scissors", icon: "✂️", color: "hover:border-rose-400" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleSelectChoice(btn.id as any)}
              className={`flex-1 py-3 px-2 rounded-2xl bg-[var(--card)] border border-[var(--border)] ${btn.color} shadow-md flex flex-col items-center justify-center gap-1 transition cursor-pointer active:scale-95 ${
                myChoice === btn.id ? "ring-2 ring-[var(--accent)] bg-[var(--accent)]/10" : ""
              }`}
            >
              <span className="text-2xl">{btn.icon}</span>
              <span className="text-[11px] font-bold text-[var(--foreground)]">{btn.label}</span>
            </button>
          ))}
        </div>
      )}

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
