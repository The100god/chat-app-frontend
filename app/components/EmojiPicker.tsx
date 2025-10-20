// components/EmojiPicker.tsx
"use client";
import React from "react";
import EmojiPickerLib, { EmojiStyle, Theme } from "emoji-picker-react";

interface Props {
  onEmojiClick: (emoji: string) => void;
}

const EmojiPicker: React.FC<Props> = ({ onEmojiClick }) => {
  return (
    <div className="absolute bottom-14 left-0 z-50 bg-[var(--background)] border border-[var(--muted)] rounded-lg shadow-lg">
      <EmojiPickerLib
        onEmojiClick={(emojiData) => onEmojiClick(emojiData.emoji)}
        theme={Theme.AUTO}
        height={350}
        emojiStyle={EmojiStyle.FACEBOOK}
      />
    </div>
  );
};

export default EmojiPicker;
