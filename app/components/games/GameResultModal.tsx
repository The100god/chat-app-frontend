"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles, Award, ArrowUpCircle, Lock, Play, X, Zap } from "lucide-react";
import { GamificationResultPayload } from "../../states/togetherTypes";

interface GameResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GamificationResultPayload | null;
  currentUserId?: string;
  onPlayAgain?: () => void;
  onSwitchGame?: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  isOpen,
  onClose,
  result,
  currentUserId,
  onPlayAgain,
  onSwitchGame,
}) => {
  if (!isOpen || !result) return null;

  const myReward = currentUserId ? result.rewards[currentUserId] : Object.values(result.rewards)[0];
  const isWinner = myReward?.isWinner;
  const leveledUp = result.levelInfo?.leveledUp;
  const currentLevel = result.levelInfo?.currentLevel || 1;
  const previousLevel = result.levelInfo?.previousLevel || 1;
  const newlyUnlocked = result.newlyUnlockedGames || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden text-center"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Big Header Trophy / Award Icon */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl ${
                  isWinner
                    ? "bg-gradient-to-tr from-amber-400 to-amber-600 shadow-amber-500/40"
                    : "bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-indigo-500/40"
                }`}
              >
                {isWinner ? (
                  <Trophy className="w-10 h-10 text-white animate-bounce" />
                ) : (
                  <Sparkles className="w-10 h-10 text-white" />
                )}
              </div>
              {leveledUp && (
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 border border-white text-[10px] font-black text-white shadow-lg flex items-center gap-1">
                  <ArrowUpCircle className="w-3 h-3" />
                  UP!
                </div>
              )}
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-wide">
            {isWinner ? "Victory!" : "Match Completed!"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isWinner
              ? "Awesome teamwork and skills! Win bonus awarded."
              : "Great game! Keep playing together to earn more points and level up."}
          </p>

          {/* Earned Points Breakdown Card */}
          <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Points Breakdown
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Zap className="w-6 h-6 text-amber-400" />
              <span className="text-3xl font-black text-amber-400">
                +{myReward?.totalEarned || 20}
              </span>
              <span className="text-xs font-bold text-amber-300">PTS</span>
            </div>

            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-300 font-medium border-t border-white/5 pt-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Participation</span>
                <span className="font-bold text-emerald-400">+{myReward?.participation || 20}</span>
              </div>
              {myReward?.winBonus ? (
                <div>
                  <span className="text-[10px] text-slate-400 block">Win Bonus</span>
                  <span className="font-bold text-amber-400">+{myReward.winBonus}</span>
                </div>
              ) : null}
              <div>
                <span className="text-[10px] text-slate-400 block">Pair Total</span>
                <span className="font-bold text-indigo-400">
                  {result.pairTotals.totalCombinedPoints} pts
                </span>
              </div>
            </div>
          </div>

          {/* Level Up Announcement */}
          {leveledUp && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center"
            >
              <div className="flex items-center justify-center gap-1.5 font-black uppercase text-[11px] text-emerald-300 tracking-wider mb-0.5">
                <Star className="w-3.5 h-3.5 fill-emerald-300" />
                Level Increased!
              </div>
              <p className="font-bold text-sm text-white">
                Level {previousLevel} &rarr; Level {currentLevel} of 20
              </p>
              <p className="text-[10px] text-emerald-200/80 mt-0.5">
                New difficulty unlocked! Next match has tighter timers and tougher courtyard obstacles.
              </p>
            </motion.div>
          )}

          {/* Newly Unlocked Games Announcement */}
          {newlyUnlocked.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-200 text-xs text-center"
            >
              <div className="flex items-center justify-center gap-1.5 font-black uppercase text-[11px] text-purple-300 tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                New Game Unlocked!
              </div>
              <p className="font-bold text-sm text-white">
                {newlyUnlocked.map((g) => g.title).join(", ")}
              </p>
              <p className="text-[10px] text-purple-200/80 mt-0.5">
                Your pair progression reached the required points threshold!
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6">
            {onSwitchGame && (
              <button
                onClick={() => {
                  onClose();
                  onSwitchGame();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Switch Game
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                if (onPlayAgain) onPlayAgain();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Continue Playing</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
