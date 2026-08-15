"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trash2, LogOut, MessageSquare, Send, Heart, Eye, Sun, Brain, CheckCircle2, RotateCcw, Lock, Unlock, Trophy } from "lucide-react";
import { DrawingState, TogetherRoom, DrawingElement } from "../../states/togetherTypes";

interface DrawingBoardProps {
  room: TogetherRoom;
  currentUserId: string;
  onEmit: (event: string, data: any) => void;
  onLeaveRoom: () => void;
}

const COLORS = [
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#ffffff", // White
];

// Expanded Object & Stamp Library
const FACIAL_OBJECTS = ["👀", "👁️", "👃", "👂", "👄", "👑"];
const NATURE_OBJECTS = ["☀️", "🌙", "⭐️", "🌈", "🌸", "🔥"];
const ROMANTIC_OBJECTS = ["❤️", "💖", "🌹", "💋", "💍", "💌", "🧸", "🕊️"];

export const DrawingBoard: React.FC<DrawingBoardProps> = ({
  room,
  currentUserId,
  onEmit,
  onLeaveRoom,
}) => {
  const drawingState = (room.state.drawing || {}) as DrawingState;
  const {
    mode = "live",
    elements = [],
    secretElements = {},
    secretSubmitted = {},
    secretRevealed = false,
    comments = [],
  } = drawingState;

  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(true);
  const [categoryTab, setCategoryTab] = useState<"romantic" | "facial" | "nature">("romantic");

  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastEmitTime = useRef<number>(0);

  const participants = room.participants || [];
  const partnerId = participants.find((id) => id !== currentUserId) || "Partner";

  const isMindMatchMode = mode === "mind_match";
  const mySecretSubmitted = !!secretSubmitted[currentUserId];

  // Current elements to render on player's main canvas
  const displayElements: DrawingElement[] = isMindMatchMode
    ? secretRevealed
      ? [
        ...(secretElements[currentUserId] || []),
        ...(secretElements[partnerId] || []),
      ]
      : secretElements[currentUserId] || []
    : elements;

  const placeElementAtCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (y / rect.height) * 100));

    const now = Date.now();
    if (now - lastEmitTime.current < 35) return;
    lastEmitTime.current = now;

    if (selectedStamp) {
      onEmit("together:drawing:addElement", {
        roomId: room.roomId,
        element: {
          type: "block",
          icon: selectedStamp,
          x,
          y,
          xPct,
          yPct,
          color: activeColor,
        },
      });
    } else {
      onEmit("together:drawing:addElement", {
        roomId: room.roomId,
        element: {
          type: "stroke",
          x,
          y,
          xPct,
          yPct,
          color: activeColor,
          size: 14,
        },
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    placeElementAtCoords(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    placeElementAtCoords(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    onEmit("together:drawing:clear", { roomId: room.roomId });
  };

  const handleSwitchMode = (newMode: "live" | "mind_match") => {
    onEmit("together:drawing:switchMode", { roomId: room.roomId, mode: newMode });
  };

  const handleSubmitSecretDrawing = () => {
    onEmit("together:drawing:submitSecret", { roomId: room.roomId });
  };

  const handleResetSecret = () => {
    onEmit("together:drawing:resetSecret", { roomId: room.roomId });
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onEmit("together:tictactoe:comment", { roomId: room.roomId, text: commentInput });
    setCommentInput("");
  };

  const currentCategoryObjects =
    categoryTab === "romantic"
      ? ROMANTIC_OBJECTS
      : categoryTab === "facial"
        ? FACIAL_OBJECTS
        : NATURE_OBJECTS;

  return (
    <div className="w-full flex flex-col items-center gap-2.5 max-w-md sm:max-w-xl mx-auto px-2 select-none">
      {/* ─── Top Control Header ─── */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-2.5 sm:p-3 shadow-md flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🎨</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wide truncate">
                Couples Canvas & Mind Match
              </h2>
              <p className="text-[10px] text-[var(--foreground)] opacity-60 font-semibold truncate">
                {isMindMatchMode
                  ? "Draw in secret & submit to reveal!"
                  : "Draw & place stamps together live!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Clear Canvas Button */}
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[11px] hover:bg-rose-500 hover:text-white transition cursor-pointer"
              title="Clear Canvas"
            >
              <Trash2 size={13} />
              <span className="hidden xs:inline">Clear</span>
            </button>
            <button
              onClick={onLeaveRoom}
              className="p-1.5 rounded-xl bg-[var(--muted)] hover:bg-[var(--accent)] hover:text-white text-[var(--foreground)] transition cursor-pointer"
              title="Leave Room"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* ─── Category Tabs (Face, Romantic, Nature) ─── */}
        <div className="flex items-center justify-between gap-1 border-t border-[var(--border)] pt-2">
          <button
            onClick={() => setCategoryTab("facial")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer ${categoryTab === "facial"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
              : "bg-[var(--muted)]/50 text-[var(--foreground)] opacity-70 hover:opacity-100"
              }`}
          >
            <Eye size={13} /> Face
          </button>
          <button
            onClick={() => setCategoryTab("romantic")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer ${categoryTab === "romantic"
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
              : "bg-[var(--muted)]/50 text-[var(--foreground)] opacity-70 hover:opacity-100"
              }`}
          >
            <Heart size={13} /> Romantic
          </button>
          <button
            onClick={() => setCategoryTab("nature")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer ${categoryTab === "nature"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
              : "bg-[var(--muted)]/50 text-[var(--foreground)] opacity-70 hover:opacity-100"
              }`}
          >
            <Sun size={13} /> Nature
          </button>
        </div>

        {/* ─── Color Palette Row ─── */}
        <div className="flex items-center justify-between gap-1.5 bg-[var(--muted)]/60 p-1.5 rounded-xl border border-[var(--border)]">
          <span className="text-[10px] font-extrabold text-[var(--foreground)] opacity-60 uppercase pl-1 shrink-0">
            Colors
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 py-0.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setActiveColor(c);
                  setSelectedStamp(null);
                }}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 sm:w-5 sm:h-5 rounded-full border border-black/30 transition cursor-pointer shrink-0 ${activeColor === c && !selectedStamp
                  ? "ring-2 ring-[var(--accent)] scale-90 shadow-md"
                  : "opacity-80 hover:opacity-100"
                  }`}
                title="Brush Color"
              />
            ))}
          </div>
        </div>

        {/* ─── Object Stamps Shelf Row ─── */}
        <div className="flex items-center gap-1.5 bg-[var(--muted)]/60 p-1.5 rounded-xl border border-[var(--border)]">
          <span className="text-[10px] font-extrabold text-[var(--foreground)] opacity-60 uppercase pl-1 shrink-0">
            Stamps
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            {currentCategoryObjects.map((stamp) => (
              <button
                key={stamp}
                onClick={() => setSelectedStamp(selectedStamp === stamp ? null : stamp)}
                className={`min-w-[32px] h-8 sm:min-w-[36px] sm:h-9 rounded-lg text-lg flex items-center justify-center transition cursor-pointer shrink-0 border ${selectedStamp === stamp
                  ? "bg-[var(--accent)] text-white border-[var(--accent)] scale-110 shadow-md ring-2 ring-[var(--accent)]/50"
                  : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)]"
                  }`}
                title={`Stamp ${stamp}`}
              >
                {stamp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2 Mode Selection Buttons (Live vs Mind Match) ─── */}
      <div className="w-full grid grid-cols-2 gap-2">
        <button
          onClick={() => handleSwitchMode("live")}
          className={`py-2 px-3 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${!isMindMatchMode
            ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-md"
            : "bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] opacity-70 hover:opacity-100"
            }`}
        >
          <Sparkles size={14} />
          1. Live Drawing
        </button>

        <button
          onClick={() => handleSwitchMode("mind_match")}
          className={`py-2 px-3 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${isMindMatchMode
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-md"
            : "bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] opacity-70 hover:opacity-100"
            }`}
        >
          <Brain size={14} />
          2. Secret Mind Match
        </button>
      </div>

      {/* Secret Mode Banner Notification */}
      {isMindMatchMode && !secretRevealed && (
        <div className="w-full max-w-[420px] sm:max-w-[480px] p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
          <Lock size={13} />
          Secret Mode: Draw/place stamps secretly! Partner cannot see until both submit.
        </div>
      )}

      {/* ─── Interactive Canvas ─── */}
      <div
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full aspect-square max-w-[420px] sm:max-w-[480px] bg-slate-950 border-2 border-[var(--accent)]/50 rounded-3xl p-2 shadow-2xl relative overflow-hidden cursor-crosshair touch-none"
      >
        {displayElements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-bold pointer-events-none text-center p-4">
            {isMindMatchMode
              ? "Draw or place secret object stamps here! Tap 'Submit My Secret Drawing' when ready."
              : "Drag or tap anywhere to draw color dots or place Eye, Nose, Ear, Sun & Romantic objects together! 💖👀"}
          </div>
        )}

        {displayElements.map((el) => {
          const posX = el.xPct !== undefined ? `${el.xPct}%` : el.x;
          const posY = el.yPct !== undefined ? `${el.yPct}%` : el.y;

          if (el.type === "block" && el.icon) {
            return (
              <motion.div
                key={el.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ left: posX, top: posY }}
                className="absolute text-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
              >
                {el.icon}
              </motion.div>
            );
          }
          return (
            <motion.div
              key={el.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                left: posX,
                top: posY,
                backgroundColor: el.color || "#06b6d4",
                width: el.size || 14,
                height: el.size || 14,
              }}
              className="absolute rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-sm"
            />
          );
        })}
      </div>

      {/* Submit Secret Drawing Button below Canvas */}
      {isMindMatchMode && !secretRevealed && (
        <div className="w-full max-w-[420px] sm:max-w-[480px]">
          {mySecretSubmitted ? (
            <div className="w-full py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={15} /> Submitted! Waiting for partner to submit their secret drawing...
            </div>
          ) : (
            <button
              onClick={handleSubmitSecretDrawing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black shadow-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock size={14} /> Submit My Secret Drawing & Lock Choice
            </button>
          )}
        </div>
      )}

      {/* ─── Mind Match Reveal Popup Modal ─── */}
      <AnimatePresence>
        {isMindMatchMode && secretRevealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-[var(--card)] border border-[var(--accent)]/50 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-3.5"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center text-3xl shadow-lg">
                🎉
              </div>

              <div>
                <h3 className="text-base font-black text-[var(--foreground)]">
                  Mind Match Revealed! 🎨✨
                </h3>
                <p className="text-xs text-[var(--foreground)] opacity-70 mt-0.5 font-medium">
                  Compare your secret drawings below! Chat with your partner to decide who won or if you matched!
                </p>
              </div>

              {/* Side by Side Canvases Preview */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                {/* Your Secret Drawing */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-[var(--accent)] uppercase tracking-wider">
                    Your Secret Canvas
                  </span>
                  <div className="w-full aspect-square bg-slate-950 border border-purple-500/40 rounded-2xl relative overflow-hidden">
                    {(secretElements[currentUserId] || []).map((el) => (
                      <div
                        key={el.id}
                        style={{
                          left: el.x ? `${(el.x / 420) * 100}%` : "50%",
                          top: el.y ? `${(el.y / 420) * 100}%` : "50%",
                          backgroundColor: el.color || "#06b6d4",
                          width: el.size ? `${(el.size / 420) * 100}%` : "3%",
                          height: el.size ? `${(el.size / 420) * 100}%` : "3%",
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 ${el.type === "block" ? "text-lg" : "rounded-full"
                          }`}
                      >
                        {el.type === "block" ? el.icon : ""}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Partner's Secret Drawing */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-pink-400 uppercase tracking-wider">
                    Partner Secret Canvas
                  </span>
                  <div className="w-full aspect-square bg-slate-950 border border-pink-500/40 rounded-2xl relative overflow-hidden">
                    {(secretElements[partnerId] || []).map((el) => (
                      <div
                        key={el.id}
                        style={{
                          left: el.x ? `${(el.x / 420) * 100}%` : "50%",
                          top: el.y ? `${(el.y / 420) * 100}%` : "50%",
                          backgroundColor: el.color || "#06b6d4",
                          width: el.size ? `${(el.size / 420) * 100}%` : "3%",
                          height: el.size ? `${(el.size / 420) * 100}%` : "3%",
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 ${el.type === "block" ? "text-lg" : "rounded-full"
                          }`}
                      >
                        {el.type === "block" ? el.icon : ""}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat prompt callout */}
              <div className="w-full py-1.5 px-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-[11px] text-[var(--foreground)] opacity-80 font-medium">
                💬 Use live comments below to decide the winner & compliment each other's drawings!
              </div>

              <div className="flex flex-col gap-2 w-full pt-1">
                <button
                  onClick={handleResetSecret}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow hover:opacity-90 transition cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Play Secret Mind Match Again
                </button>
                <button
                  onClick={() => handleSwitchMode("live")}
                  className="w-full py-2 px-4 rounded-xl bg-[var(--muted)] text-[var(--foreground)] opacity-70 hover:opacity-100 font-semibold text-xs transition cursor-pointer"
                >
                  Return to Live Canvas
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
