"use client";

import React from "react";

/**
 * ScaleTN – A skeleton placeholder that mimics a friends/chat list.
 * Shows pulsing avatar circles + text bars for a polished loading UX.
 * Accepts an optional `rows` prop (default 6) and `variant` prop.
 */

interface ScaleTNProps {
  rows?: number;
  variant?: "list" | "chat";
}

export default function ScaleTN({ rows = 6, variant = "list" }: ScaleTNProps) {
  if (variant === "chat") {
    return (
      <div className="flex flex-col gap-4 w-full h-full animate-pulse p-4">
        {/* Chat header skeleton */}
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--muted)]">
          <div className="w-10 h-10 rounded-full bg-[var(--muted)]" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-28 bg-[var(--muted)] rounded" />
            <div className="h-3 w-16 bg-[var(--muted)] rounded" />
          </div>
        </div>
        {/* Chat bubbles skeleton */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="self-start h-10 w-2/3 bg-[var(--muted)] rounded-2xl rounded-tl-sm" />
          <div className="self-end h-10 w-1/2 bg-[var(--muted)] rounded-2xl rounded-tr-sm" />
          <div className="self-start h-14 w-3/4 bg-[var(--muted)] rounded-2xl rounded-tl-sm" />
          <div className="self-end h-10 w-1/3 bg-[var(--muted)] rounded-2xl rounded-tr-sm" />
          <div className="self-start h-10 w-1/2 bg-[var(--muted)] rounded-2xl rounded-tl-sm" />
          <div className="self-end h-14 w-2/3 bg-[var(--muted)] rounded-2xl rounded-tr-sm" />
        </div>
        {/* Input bar skeleton */}
        <div className="flex items-center gap-2 pt-3 border-t border-[var(--muted)]">
          <div className="flex-1 h-10 bg-[var(--muted)] rounded-full" />
          <div className="w-10 h-10 bg-[var(--muted)] rounded-full" />
        </div>
      </div>
    );
  }

  // Default: list skeleton (friends list)
  return (
    <div className="flex flex-col gap-3 w-full animate-pulse p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-2 rounded-xl"
        >
          {/* Avatar circle */}
          <div className="w-12 h-12 rounded-full bg-[var(--muted)] shrink-0" />
          {/* Text lines */}
          <div className="flex-1 flex flex-col gap-2">
            <div
              className="h-4 bg-[var(--muted)] rounded"
              style={{ width: `${55 + (i % 3) * 15}%` }}
            />
            <div
              className="h-3 bg-[var(--muted)] rounded"
              style={{ width: `${30 + (i % 4) * 10}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
