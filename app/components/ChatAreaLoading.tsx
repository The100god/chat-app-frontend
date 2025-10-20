"use client"
// pages/random.tsx

import { useEffect, useState } from "react";

const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const emojis = ["😀", "😂", "🥺", "😎", "🤩", "😡", "😭", "😍", "😴", "👻", "💀", "🐶", "🌟", "🍔", "🚀", "🎉", "🦄", "💕","😘","😍","🤤","💪","🎂","😽","😼","🙊","🐯","🦝","🐰","🐭","🐷","👅","👀","🤴","👸","🥷","🧛","👩‍🦽","👩‍🦯","🛀","🏇","👪","💑","🍕","🍔","🍟","🍿","🍞","🍧","🧁","🎂","🍨","🍩","🥝","🍑","🍄","🌺","🍂","🍁","🌷","🌸","💐","💘","💞","💓","🕕"];

interface Item {
    id: number;
    x: number;
    y: number;
    char: string;
    delay: number;
    rotate:number;
  }

const ChatAreaLoading = () => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const newItems: Item[] = [];
    const count = 300;

    for (let i = 0; i < count; i++) {
      const randomX = Math.random() * 100;
      const randomY = Math.random() * 100;
      const isEmoji = Math.random() < 0.5;
      const char = isEmoji
        ? emojis[Math.floor(Math.random() * emojis.length)]
        : characters[Math.floor(Math.random() * characters.length)];
      const delay = Math.random() * 3;
      const rotate = Math.random() * 360; // random rotation starting angle

      newItems.push({ id: i, x: randomX, y: randomY, char, delay, rotate });
    }

    setItems(newItems);

    const interval = setInterval(() => {
      setItems((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          x: Math.random() * 100,
          y: Math.random() * 100,
          rotate: Math.random() * 360, // Also update rotation randomly
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-transparent">
      {items?.map((item, index) => (
        <div
          key={index}
          className="absolute text-[var(--foreground)] text-xs md:text-sm opacity-0 animate-fadeInOut select-none transition-all duration-700"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            transform: "translate(-50%, -50%)",
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.char}
        </div>
      ))}
    </div>
  );
};

export default ChatAreaLoading;
