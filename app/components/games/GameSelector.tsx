"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, XCircle, Handshake, Gamepad2, Play, BarChart3, Target, Award, Lock, Star, Zap, Check, X, Search } from "lucide-react";
import { GAMES_REGISTRY, TogetherGameDefinition } from "./registry";
import { GameStats, TogetherGameId, PairGamificationState } from "../../states/togetherTypes";
import { useSystemConfig } from "../../context/ConfigContext";

interface GameSelectorProps {
  selectedGameId?: TogetherGameId | null;
  onSelectGame: (gameId: TogetherGameId | null) => void;
  userStats?: Record<string, GameStats>;
  currentUserId?: string;
  partnerId?: string | null;
  partnerName?: string;
  gamificationState?: PairGamificationState | null;
  friends?: Array<{ friendId: string; username: string; name?: string; profilePic?: string }>;
  onSelectPartner?: (partnerId: string) => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  selectedGameId = null,
  onSelectGame,
  userStats = {},
  currentUserId,
  partnerId,
  partnerName,
  gamificationState,
  friends = [],
  onSelectPartner,
}) => {
  const { isGameEnabled } = useSystemConfig();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showStatsDashboard, setShowStatsDashboard] = useState<boolean>(false);
  const [partnerSearch, setPartnerSearch] = useState<string>("");

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      if (a.friendId === partnerId) return -1;
      if (b.friendId === partnerId) return 1;
      return (a.username || "").localeCompare(b.username || "");
    });
  }, [friends, partnerId]);

  const filteredPartners = useMemo(() => {
    if (!partnerSearch.trim()) return sortedFriends;
    const q = partnerSearch.toLowerCase().trim();
    return sortedFriends.filter(
      (f) =>
        f.username?.toLowerCase().includes(q) ||
        (f.name && f.name.toLowerCase().includes(q))
    );
  }, [sortedFriends, partnerSearch]);

  const filteredGames = GAMES_REGISTRY.filter(
    (g) => (filterCategory === "all" || g.category === filterCategory) && isGameEnabled(g.id)
  );

  const isLiveRoomMode = Boolean(userStats && Object.keys(userStats).length > 0);
  const isPairMode = !isLiveRoomMode && Boolean(gamificationState);

  const getStatsForGame = (gameId: string): GameStats & { pointsTogether: number; level: number } => {
    if (isLiveRoomMode) {
      if (currentUserId && userStats?.[`${gameId}_${currentUserId}`]) {
        return { ...userStats[`${gameId}_${currentUserId}`], pointsTogether: 0, level: 1 };
      }
      if (userStats?.[gameId]) {
        return { ...userStats[gameId], pointsTogether: 0, level: 1 };
      }
      return { wins: 0, losses: 0, ties: 0, total: 0, pointsTogether: 0, level: 1 };
    }

    // Pair Mode (No Room Created)
    const prog = gamificationState?.games?.find((g) => g.gameId === gameId);
    if (prog) {
      const pair = prog.pairStats;
      const myWins = pair ? pair.myWins : (prog.userWins?.[currentUserId || ""] || 0);
      const partnerWins = pair ? pair.partnerWins : 0;
      const ties = pair ? pair.ties : (prog.ties || 0);
      const total = pair ? pair.totalPlays : (prog.combinedPlays || (myWins + partnerWins + ties));
      return {
        wins: myWins,
        losses: partnerWins,
        ties: ties,
        total: total,
        pointsTogether: prog.combinedPoints || 0,
        level: prog.currentLevel || 1,
      };
    }
    return { wins: 0, losses: 0, ties: 0, total: 0, pointsTogether: 0, level: 1 };
  };

  // Compute aggregate stats across all games for current user or pair
  const computedTotalStats: GameStats & { pointsTogether: number } = isLiveRoomMode
    ? (currentUserId && userStats?.[currentUserId]
        ? { ...userStats[currentUserId], pointsTogether: 0 }
        : GAMES_REGISTRY.reduce(
            (acc, g) => {
              const st = getStatsForGame(g.id);
              return {
                wins: acc.wins + st.wins,
                losses: acc.losses + st.losses,
                ties: acc.ties + st.ties,
                total: acc.total + st.total,
                pointsTogether: 0,
              };
            },
            { wins: 0, losses: 0, ties: 0, total: 0, pointsTogether: 0 }
          ))
    : {
        wins: gamificationState?.summary?.myTotalWins ?? gamificationState?.summary?.totalCombinedWins ?? 0,
        losses: gamificationState?.summary?.partnerTotalWins ?? 0,
        ties: gamificationState?.summary?.totalTies ?? 0,
        total: gamificationState?.summary?.totalCombinedPlays ?? 0,
        pointsTogether: gamificationState?.summary?.totalCombinedPoints ?? 0,
      };

  const totalStats = computedTotalStats;
  const winRate = totalStats.total > 0 ? Math.round((totalStats.wins / totalStats.total) * 100) : 0;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ─── Pair Progression Banner (Shown only when in active game room) ─── */}
      {isLiveRoomMode && gamificationState && (
        <div className="w-full bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-500/30 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 flex-shrink-0">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-2">
                  <span>Together Progression</span>
                  {partnerName && (
                    <span className="text-[11px] font-medium text-amber-400">
                      with {partnerName}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-3 text-xs text-[var(--foreground)] opacity-80 mt-0.5">
                  <span className="font-extrabold text-amber-400 flex items-center gap-1">
                    <Zap size={12} /> {gamificationState.summary.totalCombinedPoints} Points
                  </span>
                  <span>•</span>
                  <span className="font-bold text-emerald-400">
                    {gamificationState.summary.totalCombinedWins} Wins
                  </span>
                  <span>•</span>
                  <span className="font-bold text-indigo-400">
                    {gamificationState.summary.unlockedGamesCount} / 7 Games Unlocked
                  </span>
                </div>
              </div>
            </div>

            {/* Next Unlock Goal */}
            {(() => {
              const nextLocked = gamificationState.games.find((g) => !g.isUnlocked);
              if (!nextLocked) {
                return (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      All Games Unlocked!
                    </span>
                    <span className="text-xs font-bold text-[var(--foreground)] opacity-70">
                      Keep leveling up to Level 20!
                    </span>
                  </div>
                );
              }
              const ptsNeeded = nextLocked.unlockRequirements?.pointsRequired || 0;
              const currentPts = gamificationState.summary.totalCombinedPoints;
              const pct = Math.min(100, Math.round((currentPts / (ptsNeeded || 1)) * 100));

              return (
                <div className="sm:text-right min-w-[180px]">
                  <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] font-bold">
                    <span className="text-[var(--foreground)] opacity-70">Next: {nextLocked.title}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono">
                      {currentPts} / {ptsNeeded} pts ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-black/40 h-2 rounded-full mt-1.5 overflow-hidden border border-slate-300 dark:border-white/10">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

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

      {/* ─── Mobile / Small Screen Stats Modal (< sm) ─── */}
      <AnimatePresence>
        {showStatsDashboard && (
          <div className="sm:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              className="w-full max-w-sm max-h-[85vh] bg-[var(--card)] border border-[var(--accent)]/40 rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                      {isPairMode ? <Zap size={16} /> : "🏆"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider truncate">
                        {isPairMode ? `Pair Stats: You ⇄ ${partnerName || "Partner"}` : "Session Stats"}
                      </h3>
                      <p className="text-[10px] text-[var(--foreground)] opacity-60 font-semibold truncate">
                        {isPairMode ? "Lifetime matches & points together" : "Live multiplayer metrics"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-400">{winRate}%</span>
                      <p className="text-[9px] text-[var(--foreground)] opacity-50 uppercase font-bold">Win Rate</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowStatsDashboard(false)}
                      className="p-1 rounded-xl bg-[var(--muted)] hover:bg-[var(--accent)] hover:text-white text-[var(--foreground)] transition cursor-pointer"
                      title="Close Stats Modal"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Partner Switcher (When in Pair Mode with multiple friends) */}
                {isPairMode && friends.length > 1 && onSelectPartner && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--foreground)] opacity-60 font-bold whitespace-nowrap">
                        With Partner ({filteredPartners.length}):
                      </span>
                      {friends.length > 6 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-[10px]">
                          <Search size={10} className="opacity-50" />
                          <input
                            type="text"
                            value={partnerSearch}
                            onChange={(e) => setPartnerSearch(e.target.value)}
                            placeholder="Filter..."
                            className="bg-transparent border-none outline-none text-[10px] w-16 text-[var(--foreground)]"
                          />
                          {partnerSearch && (
                            <button onClick={() => setPartnerSearch("")} className="cursor-pointer opacity-60 hover:opacity-100">
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                      {filteredPartners.map((f) => {
                        const isSelected = f.friendId === partnerId;
                        return (
                          <button
                            key={f.friendId}
                            type="button"
                            onClick={() => onSelectPartner(f.friendId)}
                            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer whitespace-nowrap border ${
                              isSelected
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                                : "bg-[var(--muted)] text-[var(--foreground)] opacity-70 border-[var(--border)] hover:opacity-100"
                            }`}
                          >
                            {isSelected ? "⚡ " : ""}{f.username}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Overall Stats Cards */}
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {isPairMode ? (
                  <>
                    <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-amber-400 uppercase flex items-center gap-0.5" title="Combined Points">
                        <Zap size={10} /> Points
                      </span>
                      <p className="text-sm font-black text-amber-300">{totalStats.pointsTogether}</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase flex items-center gap-0.5" title="Your Wins">
                        <Trophy size={10} /> You (W)
                      </span>
                      <p className="text-sm font-black text-emerald-300">{totalStats.wins}</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-rose-400 uppercase flex items-center gap-0.5" title="Partner Wins">
                        <XCircle size={10} /> Partner
                      </span>
                      <p className="text-sm font-black text-rose-300">{totalStats.losses}</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-purple-400 uppercase flex items-center gap-0.5" title="Ties">
                        <Handshake size={10} /> Ties
                      </span>
                      <p className="text-sm font-black text-purple-300">{totalStats.ties}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase flex items-center gap-0.5" title="Wins">
                        <Trophy size={10} /> Wins
                      </span>
                      <p className="text-base font-black text-emerald-300">{totalStats.wins}</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-rose-400 uppercase flex items-center gap-0.5" title="Losses">
                        <XCircle size={10} /> Losses
                      </span>
                      <p className="text-base font-black text-rose-300">{totalStats.losses}</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-amber-400 uppercase flex items-center gap-0.5" title="Ties">
                        <Handshake size={10} /> Ties
                      </span>
                      <p className="text-base font-black text-amber-300">{totalStats.ties}</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-purple-400 uppercase flex items-center gap-0.5" title="Played">
                        <Gamepad2 size={10} /> Total
                      </span>
                      <p className="text-base font-black text-purple-300">{totalStats.total}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Scrollable Individual Game Breakdown */}
              <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 max-h-[50vh]">
                {GAMES_REGISTRY.filter((game) => isGameEnabled(game.id)).map((game) => {
                  const st = getStatsForGame(game.id);
                  return (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[var(--muted)]/60 border border-[var(--border)]"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img src={game.iconPath} alt={game.title} className="w-6 h-6 object-contain flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-[var(--foreground)] truncate">{game.title}</h4>
                            {st.level ? (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 flex-shrink-0">
                                Lvl {st.level}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[9px] text-[var(--foreground)] opacity-70 flex items-center gap-1.5 font-bold mt-0.5 flex-wrap">
                            <span className="text-emerald-400 flex items-center gap-0.5" title={`${st.wins} Wins`}><Trophy size={9} />{st.wins}W</span>
                            <span className="text-rose-400 flex items-center gap-0.5" title={`${st.losses} Losses`}><XCircle size={9} />{st.losses}L</span>
                            <span className="text-amber-400 flex items-center gap-0.5" title={`${st.ties} Ties`}><Handshake size={9} />{st.ties}T</span>
                            {isPairMode && st.pointsTogether > 0 ? (
                              <span className="text-amber-300 font-mono text-[9px] flex items-center gap-0.5">⚡ {st.pointsTogether} pts</span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0 pl-1.5">
                        <span className="text-[10px] font-black text-[var(--foreground)]">
                          {st.total}
                        </span>
                        <span className="text-[8px] font-semibold text-[var(--foreground)] opacity-40 uppercase">
                          {st.total === 1 ? "game" : "games"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer Close Button */}
              <button
                type="button"
                onClick={() => setShowStatsDashboard(false)}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer hover:opacity-95 transition"
              >
                Close Stats
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Desktop Overall Stats Dashboard (>= sm) ─── */}
      <AnimatePresence>
        {showStatsDashboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="hidden sm:flex w-full bg-[var(--card)] border border-[var(--accent)]/40 rounded-2xl p-4 shadow-xl flex-col gap-4 overflow-hidden"
          >
            <div className="flex flex-col gap-2.5 border-b border-[var(--border)] pb-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                    {isPairMode ? <Zap size={18} /> : "🏆"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider truncate">
                      {isPairMode ? `Pair Stats: You ⇄ ${partnerName || "Partner"}` : "Session Player Stats Overview"}
                    </h3>
                    <p className="text-[10px] text-[var(--foreground)] opacity-60 font-semibold truncate">
                      {isPairMode
                        ? "Real-time performance & points together across all Together games"
                        : "Real-time performance across all 6 Together games"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400">{winRate}%</span>
                    <p className="text-[9px] text-[var(--foreground)] opacity-50 uppercase font-bold">Win Rate</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStatsDashboard(false)}
                    className="p-1.5 rounded-xl bg-[var(--muted)] hover:bg-[var(--accent)] hover:text-white text-[var(--foreground)] transition cursor-pointer"
                    title="Close"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Partner Switcher (When in Pair Mode with multiple friends) */}
              {isPairMode && friends.length > 1 && onSelectPartner && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--foreground)] opacity-70 font-bold whitespace-nowrap">
                      With Partner ({filteredPartners.length}):
                    </span>
                    {friends.length > 6 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs">
                        <Search size={12} className="opacity-50" />
                        <input
                          type="text"
                          value={partnerSearch}
                          onChange={(e) => setPartnerSearch(e.target.value)}
                          placeholder="Search friend..."
                          className="bg-transparent border-none outline-none text-xs w-28 text-[var(--foreground)]"
                        />
                        {partnerSearch && (
                          <button onClick={() => setPartnerSearch("")} className="cursor-pointer opacity-60 hover:opacity-100">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
                    {filteredPartners.map((f) => {
                      const isSelected = f.friendId === partnerId;
                      return (
                        <button
                          key={f.friendId}
                          type="button"
                          onClick={() => onSelectPartner(f.friendId)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                            isSelected
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs"
                              : "bg-[var(--muted)] text-[var(--foreground)] opacity-70 border-[var(--border)] hover:opacity-100"
                          }`}
                        >
                          {isSelected ? "⚡ " : ""}{f.username}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Overall Stats Cards */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {isPairMode ? (
                <>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1" title="Combined Points">
                      <Zap size={12} />
                      <span className="hidden sm:inline">Points Together</span>
                      <span className="sm:hidden">Points</span>
                    </span>
                    <p className="text-lg font-black text-amber-300">{totalStats.pointsTogether}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1" title="Your Wins">
                      <Trophy size={12} />
                      <span className="hidden sm:inline">Your Wins (W)</span>
                      <span className="sm:hidden">Wins</span>
                    </span>
                    <p className="text-lg font-black text-emerald-300">{totalStats.wins}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1" title="Partner Wins">
                      <XCircle size={12} />
                      <span className="hidden sm:inline">Partner (L)</span>
                      <span className="sm:hidden">Losses</span>
                    </span>
                    <p className="text-lg font-black text-rose-300">{totalStats.losses}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1" title="Ties">
                      <Handshake size={12} />
                      <span className="hidden sm:inline">Ties (T)</span>
                      <span className="sm:hidden">Ties</span>
                    </span>
                    <p className="text-lg font-black text-purple-300">{totalStats.ties}</p>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Individual Game Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {GAMES_REGISTRY.filter((game) => isGameEnabled(game.id)).map((game) => {
                const st = getStatsForGame(game.id);
                return (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--muted)]/60 border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img src={game.iconPath} alt={game.title} className="w-7 h-7 object-contain flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[var(--foreground)] truncate">{game.title}</h4>
                          {st.level ? (
                            <span className="text-[9px] px-1 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 flex-shrink-0">
                              Lvl {st.level}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-[var(--foreground)] opacity-70 flex items-center gap-2 font-bold mt-0.5 flex-wrap">
                          <span className="text-emerald-400 flex items-center gap-0.5" title={`${st.wins} Wins`}><Trophy size={10} />{st.wins}W</span>
                          <span className="text-rose-400 flex items-center gap-0.5" title={`${st.losses} Losses`}><XCircle size={10} />{st.losses}L</span>
                          <span className="text-amber-400 flex items-center gap-0.5" title={`${st.ties} Ties`}><Handshake size={10} />{st.ties}T</span>
                          {isPairMode && st.pointsTogether > 0 ? (
                            <span className="text-amber-300 font-mono text-[9px] flex items-center gap-0.5">⚡ {st.pointsTogether} pts</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 pl-2">
                      <span className="text-[11px] font-black text-[var(--foreground)]">
                        {st.total}
                      </span>
                      <span className="text-[9px] font-semibold text-[var(--foreground)] opacity-40 uppercase tracking-wider">
                        {st.total === 1 ? "match" : "matches"}
                      </span>
                    </div>
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

          const gameProg = gamificationState?.games.find((p) => p.gameId === game.id);
          const isUnlocked = gameProg ? gameProg.isUnlocked : true;
          const currentLvl = gameProg?.currentLevel || 1;
          const pointsNeeded = gameProg?.unlockRequirements?.pointsRequired || 0;
          const pairPoints = gamificationState?.summary?.totalCombinedPoints || 0;
          const timeSec = gameProg?.currentLevelConfig?.timeSec || 30;

          return (
            <motion.div
              key={game.id}
              whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
              whileTap={{ scale: isUnlocked ? 0.98 : 1 }}
              onClick={() => {
                if (isUnlocked) {
                  onSelectGame(game.id);
                }
              }}
              className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all cursor-pointer shadow-md overflow-hidden ${
                !isUnlocked
                  ? "bg-[var(--card)] border-[var(--border)] opacity-80 cursor-not-allowed"
                  : isSelected
                  ? "bg-gradient-to-br from-[var(--card)] via-[var(--accent)]/10 to-[var(--card)] border-[var(--accent)] ring-1 ring-[var(--accent)]/40 shadow-lg shadow-[var(--accent)]/20"
                  : "bg-[var(--card)] border-[var(--border)] opacity-85 hover:opacity-100 hover:border-[var(--accent)]/40 hover:shadow-md"
              }`}
            >
              {/* Active Glow border line */}
              {isSelected && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-[var(--accent)] to-cyan-400 z-20" />
              )}

              {/* Locked Overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center rounded-2xl select-none">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-2 shadow-lg">
                    <Lock size={18} />
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Locked Game</h4>
                  <p className="text-[11px] text-slate-300 mt-1 font-semibold">
                    Requires <span className="text-amber-400 font-bold">{pointsNeeded} Pair Points</span>
                  </p>
                  {gameProg?.unlockRequirements?.requiredPreviousGames?.length ? (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Prereq:{" "}
                      {gameProg.unlockRequirements.requiredPreviousGames
                        .map((r) => `${r.gameId} (${r.minWins} wins)`)
                        .join(", ")}
                    </p>
                  ) : null}
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-2.5 overflow-hidden max-w-[140px]">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((pairPoints / (pointsNeeded || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 font-mono">
                    {pairPoints} / {pointsNeeded} pts
                  </span>
                </div>
              )}

              {/* Game Icon & Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${game.badgeColor} p-2 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0`}
                  >
                    <img
                      src={game.iconPath}
                      alt={game.title}
                      className="w-full h-full max-w-full max-h-full object-contain filter drop-shadow-sm flex-shrink-0"
                    />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[var(--foreground)] truncate leading-tight" title={game.title}>
                      {game.title}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-[var(--foreground)] opacity-60 font-medium truncate mt-0.5" title={game.subtitle}>
                      {game.subtitle}
                    </p>
                  </div>
                </div>

                {/* Level / Status Badge */}
                {isUnlocked ? (
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1 shadow-xs whitespace-nowrap">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      Lvl {currentLvl}
                    </span>
                    {isSelected ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-0.5 whitespace-nowrap">
                        <Check size={9} className="stroke-[3]" /> Active
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--muted)] text-[var(--foreground)] opacity-60 border border-[var(--border)] font-mono whitespace-nowrap">
                        {timeSec}s timer
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 whitespace-nowrap flex-shrink-0">
                    <Lock size={10} /> Locked
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-[var(--foreground)] opacity-75 my-2.5 line-clamp-2">
                {game.description}
              </p>

              {/* Stats Bar (Show only when inside an active game room) */}
              {isLiveRoomMode && (
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
                  <span className="opacity-60">
                    {isPairMode && stats.pointsTogether > 0
                      ? `⚡ ${stats.pointsTogether} pts`
                      : `${stats.total} Total`}
                  </span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                disabled={!isUnlocked}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isUnlocked) {
                    if (isSelected) {
                      onSelectGame(null);
                    } else {
                      onSelectGame(game.id);
                    }
                  }
                }}
                className={`w-full mt-3 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-[0.98] ${
                  !isUnlocked
                    ? "bg-slate-800/90 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                    : isSelected
                    ? "hover:!bg-none hover:!bg-rose-600 hover:!border-rose-400 text-white border shadow-md group/btn"
                    : "text-white hover:brightness-110 border"
                }`}
                style={
                  isUnlocked
                    ? isSelected
                      ? {
                          background: "linear-gradient(135deg, var(--accent), var(--primary))",
                          borderColor: "color-mix(in srgb, var(--accent) 75%, transparent)",
                          boxShadow: "0 4px 14px -2px color-mix(in srgb, var(--accent) 35%, transparent)",
                        }
                      : {
                          background: "linear-gradient(135deg, var(--primary), var(--accent))",
                          borderColor: "color-mix(in srgb, var(--accent) 60%, transparent)",
                          boxShadow: "0 4px 14px -2px color-mix(in srgb, var(--accent) 35%, transparent)",
                        }
                    : undefined
                }
              >
                {!isUnlocked ? (
                  <>
                    <Lock size={13} />
                    <span>Locked ({pointsNeeded} pts)</span>
                  </>
                ) : isSelected ? (
                  <>
                    <Check size={14} className="stroke-[3] group-hover/btn:hidden" />
                    <X size={14} className="stroke-[3] hidden group-hover/btn:inline" />
                    <span className="group-hover/btn:hidden">Selected Game</span>
                    <span className="hidden group-hover/btn:inline">Cancel Selection</span>
                  </>
                ) : (
                  <>
                    <Play size={13} fill="currentColor" />
                    <span>Play Now</span>
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
