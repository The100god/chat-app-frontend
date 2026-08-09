"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, XCircle, Handshake, Gamepad2, Play, BarChart3, Target, Award } from "lucide-react";
import { GAMES_REGISTRY, TogetherGameDefinition } from "./registry";
import { GameStats, TogetherGameId } from "../../states/togetherTypes";

interface GameSelectorProps {
  selectedGameId?: TogetherGameId | null;
  onSelectGame: (gameId: TogetherGameId) => void;
  userStats?: Record<string, GameStats>;
  currentUserId?: string;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  selectedGameId = null,
  onSelectGame,
  userStats = {},
  currentUserId,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showStatsDashboard, setShowStatsDashboard] = useState<boolean>(false);

  const filteredGames = GAMES_REGISTRY.filter(
    (g) => filterCategory === "all" || g.category === filterCategory
  );

  const getStatsForGame = (gameId: string): GameStats => {
    if (currentUserId && userStats[`${gameId}_${currentUserId}`]) {
      return userStats[`${gameId}_${currentUserId}`];
    }
    if (userStats[gameId]) {
      return userStats[gameId];
    }
    return { wins: 0, losses: 0, ties: 0, total: 0 };
  };

  // Compute aggregate stats across all games for current user or room
  const totalStats = currentUserId && userStats[currentUserId]
    ? userStats[currentUserId]
    : GAMES_REGISTRY.reduce(
        (acc, g) => {
          const st = getStatsForGame(g.id);
          return {
            wins: acc.wins + st.wins,
            losses: acc.losses + st.losses,
            ties: acc.ties + st.ties,
            total: acc.total + st.total,
          };
        },
        { wins: 0, losses: 0, ties: 0, total: 0 }
      );

  const winRate = totalStats.total > 0 ? Math.round((totalStats.wins / totalStats.total) * 100) : 0;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ─── Category Filter Header & Right-Side Stats Option ─── */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        {/* Left: Category Filters */}
        <div className="flex items-center gap-1.5 bg-[var(--muted)] p-1 rounded-xl border border-[var(--border)] overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "All Games", icon: Gamepad2 },
            { id: "classic", label: "Classic", icon: Sparkles },
            { id: "arcade", label: "Arcade", icon: Trophy },
            { id: "creative", label: "Creative", icon: Sparkles },
            { id: "trivia", label: "Quiz", icon: Gamepad2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = filterCategory === tab.id && !showStatsDashboard;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterCategory(tab.id);
                  setShowStatsDashboard(false);
                }}
                title={tab.label}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${isActive
                    ? "bg-[var(--accent)] text-white shadow"
                    : "text-[var(--foreground)] opacity-70 hover:opacity-100"
                  }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Stats Toggle Button */}
        <button
          type="button"
          onClick={() => setShowStatsDashboard(!showStatsDashboard)}
          title="Game Stats"
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-sm border flex-shrink-0 ${showStatsDashboard
              ? "bg-gradient-to-r from-amber-500 to-purple-600 text-white border-amber-400"
              : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] opacity-80 hover:opacity-100 hover:border-[var(--accent)]"
            }`}
        >
          <BarChart3 size={14} />
          <span className="hidden sm:inline">{showStatsDashboard ? "Hide Stats" : "Game Stats"}</span>
        </button>
      </div>

      {/* ─── Overall Stats Dashboard ─── */}
      <AnimatePresence>
        {showStatsDashboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-[var(--card)] border border-[var(--accent)]/40 rounded-2xl p-4 shadow-xl flex flex-col gap-4 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-extrabold text-sm">
                  🏆
                </div>
                <div>
                  <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider">
                    Session Player Stats Overview
                  </h3>
                  <p className="text-[10px] text-[var(--foreground)] opacity-60 font-semibold">
                    Real-time performance across all 6 Together games
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-400">{winRate}%</span>
                <p className="text-[9px] text-[var(--foreground)] opacity-50 uppercase font-bold">Win Rate</p>
              </div>
            </div>

            {/* Overall Stats Cards */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center">
                <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1" title="Wins">
                  <Trophy size={12} />
                  <span className="hidden sm:inline">Wins</span>
                </span>
                <p className="text-lg font-black text-emerald-300">{totalStats.wins}</p>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col items-center">
                <span className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1" title="Losses">
                  <XCircle size={12} />
                  <span className="hidden sm:inline">Losses</span>
                </span>
                <p className="text-lg font-black text-rose-300">{totalStats.losses}</p>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center">
                <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1" title="Ties">
                  <Handshake size={12} />
                  <span className="hidden sm:inline">Ties</span>
                </span>
                <p className="text-lg font-black text-amber-300">{totalStats.ties}</p>
              </div>
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col items-center">
                <span className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1" title="Total Played">
                  <Gamepad2 size={12} />
                  <span className="hidden sm:inline">Played</span>
                </span>
                <p className="text-lg font-black text-purple-300">{totalStats.total}</p>
              </div>
            </div>

            {/* Individual Game Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {GAMES_REGISTRY.map((game) => {
                const st = getStatsForGame(game.id);
                return (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--muted)]/60 border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-2">
                      <img src={game.iconPath} alt={game.title} className="w-6 h-6 object-contain" />
                      <div>
                        <h4 className="text-xs font-bold text-[var(--foreground)]">{game.title}</h4>
                        <p className="text-[10px] text-[var(--foreground)] opacity-70 flex items-center gap-1.5 font-bold">
                          <span className="text-emerald-400 flex items-center gap-0.5" title={`${st.wins} Wins`}><Trophy size={10} />{st.wins}<span className="hidden sm:inline">W</span></span>
                          <span className="text-rose-400 flex items-center gap-0.5" title={`${st.losses} Losses`}><XCircle size={10} />{st.losses}<span className="hidden sm:inline">L</span></span>
                          <span className="text-amber-400 flex items-center gap-0.5" title={`${st.ties} Ties`}><Handshake size={10} />{st.ties}<span className="hidden sm:inline">T</span></span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectGame(game.id)}
                      className="px-2 py-1 rounded-lg bg-[var(--accent)] text-white text-[10px] font-bold hover:opacity-90 transition cursor-pointer"
                    >
                      Play
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Games Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {filteredGames.map((game: TogetherGameDefinition) => {
          const isSelected = selectedGameId !== null && selectedGameId === game.id;
          const stats = getStatsForGame(game.id);

          return (
            <motion.div
              key={game.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectGame(game.id)}
              className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all cursor-pointer shadow-md overflow-hidden ${isSelected
                  ? "bg-gradient-to-br from-[var(--card)] via-[var(--accent)]/10 to-[var(--card)] border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20"
                  : "bg-[var(--card)] border-[var(--border)] opacity-85 hover:opacity-100 hover:border-[var(--accent)]/40"
                }`}
            >
              {/* Active Glow border line */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
              )}

              {/* Game Icon & Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${game.badgeColor} p-2 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0`}
                  >
                    <img src={game.iconPath} alt={game.title} className="w-full h-full object-contain filter drop-shadow-sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-1.5">
                      {game.title}
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)] text-white font-bold">
                          Selected
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-[var(--foreground)] opacity-60 font-medium">
                      {game.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[var(--foreground)] opacity-75 my-2.5 line-clamp-2">
                {game.description}
              </p>

              {/* Stats Bar */}
              <div className="w-full bg-[var(--muted)]/60 rounded-xl p-1.5 border border-[var(--border)] flex items-center justify-between text-[10px] font-bold text-[var(--foreground)]">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-emerald-400">
                    <Trophy size={11} /> {stats.wins} W
                  </span>
                  <span className="flex items-center gap-0.5 text-rose-400">
                    <XCircle size={11} /> {stats.losses} L
                  </span>
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <Handshake size={11} /> {stats.ties} T
                  </span>
                </div>
                <span className="opacity-60">{stats.total} Total</span>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectGame(game.id);
                }}
                className={`w-full mt-2.5 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow ${isSelected
                    ? "bg-gradient-to-r from-[var(--accent)] to-cyan-500 text-white"
                    : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-white"
                  }`}
              >
                <Play size={12} fill="currentColor" />
                <span>{isSelected ? "Selected Game" : "Play"}</span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
