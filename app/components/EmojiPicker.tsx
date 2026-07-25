// components/EmojiPicker.tsx
"use client";
import React from "react";
import EmojiPickerLib, { EmojiStyle, Theme } from "emoji-picker-react";

interface Props {
  onEmojiClick: (emoji: string) => void;
}

const EmojiPicker: React.FC<Props> = ({ onEmojiClick }) => {
  return (
    <div className="fixed bottom-20 left-4 right-4 md:absolute md:bottom-14 md:left-0 md:right-auto z-50 bg-[var(--card)] border border-[var(--accent)]/30 rounded-2xl shadow-2xl overflow-hidden max-w-md mx-auto md:mx-0 flex flex-col">
      <EmojiPickerLib
        onEmojiClick={(emojiData) => onEmojiClick(emojiData.emoji)}
        theme={Theme.AUTO}
        height={320}
        width="100%"
        emojiStyle={EmojiStyle.FACEBOOK}
        autoFocusSearch={false}
      />
    </div>
  );
};

export default EmojiPicker;
