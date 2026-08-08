// d:\Next.js\Chat\chat-app-frontend\app\components\activities\ActivitySelector.tsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TogetherActivityId } from "../../states/togetherTypes";
import { ACTIVITIES_REGISTRY } from "./activityRegistry";
import { Heart, Sparkles, Flame, Scale, Calendar, MessageCircle, Play } from "lucide-react";

interface ActivitySelectorProps {
  selectedActivityId?: TogetherActivityId | null;
  onSelectActivity: (activityId: TogetherActivityId) => void;
}

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({
  selectedActivityId,
  onSelectActivity,
}) => {
  const [filter, setFilter] = useState<string>("all");

  const filteredActivities = ACTIVITIES_REGISTRY.filter((act) => {
    if (filter === "all") return true;
    return act.type === filter;
  });

  const getIconComponent = (id: TogetherActivityId) => {
    switch (id) {
      case "would_you_rather":
        return <Heart className="text-pink-400" size={24} />;
      case "truth_or_dare":
        return <Flame className="text-red-400" size={24} />;
      case "this_or_that":
        return <Scale className="text-purple-400" size={24} />;
      case "daily_question":
        return <Calendar className="text-emerald-400" size={24} />;
      case "couple_questions":
        return <MessageCircle className="text-amber-400" size={24} />;
      default:
        return <Sparkles className="text-indigo-400" size={24} />;
    }
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* ─── Hero Banner Header ─── */}
      <div className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl flex flex-col gap-3 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow">
            ❤️
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider">Couple Activities</h2>
            <p className="text-xs text-white/80 font-medium">
              Discover real-time interactive challenges, Would You Rather, Truth or Dare, and Daily Questions!
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {["all", "scenario", "turn_based", "comparison", "daily", "categorized"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition cursor-pointer ${
                filter === f
                  ? "bg-white text-rose-600 shadow"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Activity Cards Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities.map((act) => {
          const isSelected = selectedActivityId === act.id;

          return (
            <motion.div
              key={act.id}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectActivity(act.id)}
              className={`relative rounded-2xl p-5 border cursor-pointer transition shadow-lg flex flex-col justify-between overflow-hidden bg-[var(--card)] ${
                isSelected
                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                  : "border-[var(--border)] hover:border-[var(--accent)]/60"
              }`}
            >
              {/* Background Glow */}
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl pointer-events-none"
                style={{ backgroundColor: act.color }}
              />

              <div className="flex flex-col gap-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md"
                    style={{ backgroundColor: `${act.color}20`, color: act.color }}
                  >
                    {act.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--muted)] text-[var(--foreground)] opacity-70 border border-[var(--border)]">
                    {act.type.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[var(--foreground)] mb-1">
                    {act.title}
                  </h3>
                  <p className="text-xs text-[var(--foreground)] opacity-70 leading-relaxed font-medium">
                    {act.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-[var(--border)]/50 flex items-center justify-between relative z-10">
                <span className="text-[11px] font-bold text-[var(--accent)] flex items-center gap-1">
                  Start Session
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow"
                  style={{ backgroundColor: act.color }}
                >
                  <Play size={14} className="ml-0.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
