"use client";

import React from "react";
import { Heart } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--card)] border-t border-[var(--border)] py-1.5 px-4 text-center text-xs text-[var(--foreground)] opacity-80 flex items-center justify-center gap-1.5 z-30 select-none flex-shrink-0">
      <span>Crafted with</span>
      <Heart size={13} className="text-red-500 fill-red-500 inline animate-pulse" />
      <span>by <strong className="font-semibold text-[var(--foreground)]">Saurabh Goyal</strong></span>
    </footer>
  );
};

export default Footer;
