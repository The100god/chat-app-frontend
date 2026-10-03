"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { animatedBgEnabledAtom, animatedBgTextAtom, animatedBgTextColorAtom } from "../states/States";

interface EmojiItem {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  duration: number;
}

const PRESET_EMOJIS: EmojiItem[] = [
  { id: 1, emoji: "🌸", x: 6, y: 8, size: 1.5, duration: 8.5 },
  { id: 2, emoji: "💖", x: 88, y: 12, size: 1.4, duration: 9.2 },
  { id: 3, emoji: "✨", x: 22, y: 22, size: 1.2, duration: 7.8 },
  { id: 4, emoji: "🌺", x: 74, y: 28, size: 1.6, duration: 10.1 },
  { id: 5, emoji: "💕", x: 8, y: 42, size: 1.4, duration: 8.9 },
  { id: 6, emoji: "🦋", x: 92, y: 48, size: 1.5, duration: 9.6 },
  { id: 7, emoji: "🌷", x: 18, y: 60, size: 1.3, duration: 8.2 },
  { id: 8, emoji: "💫", x: 82, y: 66, size: 1.3, duration: 7.5 },
  { id: 9, emoji: "❤️", x: 12, y: 78, size: 1.5, duration: 9.0 },
  { id: 10, emoji: "🌟", x: 86, y: 82, size: 1.6, duration: 10.4 },
  { id: 11, emoji: "🥰", x: 30, y: 90, size: 1.4, duration: 8.6 },
  { id: 12, emoji: "💌", x: 68, y: 92, size: 1.5, duration: 9.1 },
  { id: 13, emoji: "🌹", x: 48, y: 16, size: 1.4, duration: 8.7 },
  { id: 14, emoji: "🎉", x: 52, y: 76, size: 1.3, duration: 9.8 },
];

function parseCustomEmojisOrText(input: string): string[] {
  if (!input || !input.trim()) return [];

  // Split by space if user typed space-separated words or emojis
  const spaceParts = input.trim().split(/\s+/).filter(Boolean);
  if (spaceParts.length > 1) {
    return spaceParts;
  }

  // Use Intl.Segmenter for grapheme clusters (emojis, complex scripts)
  if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter("en", { granularity: "grapheme" });
      const segments: string[] = [];
      for (const seg of segmenter.segment(input.trim())) {
        const val = seg.segment.trim();
        if (val) segments.push(val);
      }
      if (segments.length > 0) return segments;
    } catch {
      // Fallback below
    }
  }

  // Fallback: character by character
  return Array.from(input.trim()).filter((c) => c !== " ");
}

interface AnimatedEmojiBackgroundProps {
  className?: string;
  isAbsolute?: boolean;
}

export default function AnimatedEmojiBackground({
  className = "",
  isAbsolute = false,
}: AnimatedEmojiBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useAtom(animatedBgEnabledAtom);
  const [customText, setCustomText] = useAtom(animatedBgTextAtom);
  const [customTextColor, setCustomTextColor] = useAtom(animatedBgTextColorAtom);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedEnabled = localStorage.getItem("animatedBgEnabled");
      if (savedEnabled !== null) {
        setEnabled(savedEnabled !== "false");
      }
      const savedText = localStorage.getItem("animatedBgText");
      if (savedText !== null) {
        setCustomText(savedText);
      }
      const savedColor = localStorage.getItem("animatedBgTextColor");
      if (savedColor !== null) {
        setCustomTextColor(savedColor);
      }
    }
  }, [setEnabled, setCustomText, setCustomTextColor]);

  if (!mounted || !enabled) return null;

  const customTokens = parseCustomEmojisOrText(customText);
  const isCustom = customTokens.length > 0;
  const resolvedColor = customTextColor || "var(--foreground)";

  return (
    <div
      className={`${
        isAbsolute ? "absolute" : "fixed"
      } inset-0 overflow-hidden pointer-events-none z-0 select-none ${className}`}
      aria-hidden="true"
    >
      {PRESET_EMOJIS.map((e, index) => {
        const displayText =
          customTokens.length > 0
            ? customTokens[index % customTokens.length]
            : e.emoji;

        return (
          <motion.span
            key={`${e.id}-${displayText}`}
            initial={{ opacity: 0.08, y: 0 }}
            animate={{
              opacity: isCustom ? [0.25, 0.60, 0.25] : [0.10, 0.32, 0.10],
              y: [8, -20, 8],
              rotate: [0, 8, -8, 0],
            }}
            transition={{
              duration: e.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute select-none pointer-events-none"
            style={{
              top: `${e.y}%`,
              left: `${e.x}%`,
              fontSize: `${e.size}rem`,
              color: resolvedColor,
              fontWeight: 600,
              filter: "blur(0.2px)",
              textShadow: customTextColor ? `0 0 12px ${customTextColor}40` : undefined,
            }}
          >
            {displayText}
          </motion.span>
        );
      })}
    </div>
  );
}
