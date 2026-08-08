import { TogetherGameId } from "../../states/togetherTypes";

export interface TogetherGameDefinition {
  id: TogetherGameId;
  title: string;
  subtitle: string;
  description: string;
  icon: string; // Emoji fallback
  iconPath: string; // Path to image icon in /public/game-icons
  badgeColor: string; // Tailwind gradient/color class
  minPlayers: number;
  maxPlayers: number;
  status: "active" | "coming_soon";
  category: "classic" | "arcade" | "creative" | "trivia";
}

export const GAMES_REGISTRY: TogetherGameDefinition[] = [
  {
    id: "tictactoe",
    title: "Tic-Tac-Toe",
    subtitle: "Classic 3x3 Strategy",
    description: "Battle a friend in real-time. Align 3 symbols (X or O) to win!",
    icon: "❌⭕",
    iconPath: "/game-icons/tictactoe.png",
    badgeColor: "from-cyan-500 to-blue-600",
    minPlayers: 2,
    maxPlayers: 2,
    status: "active",
    category: "classic",
  },
  {
    id: "rps",
    title: "Rock Paper Scissors",
    subtitle: "Secret Move Showdown",
    description: "Simultaneous secret choices! Reveal cards to see who takes the round.",
    icon: "✂️🪨",
    iconPath: "/game-icons/rps.png",
    badgeColor: "from-rose-500 to-pink-600",
    minPlayers: 2,
    maxPlayers: 2,
    status: "active",
    category: "arcade",
  },
  {
    id: "connect4",
    title: "Connect 4",
    subtitle: "4-in-a-Row Gravity Drop",
    description: "Drop colored discs into columns and connect 4 in a row to win!",
    icon: "🔴🟡",
    iconPath: "/game-icons/connect4.png",
    badgeColor: "from-amber-500 to-red-500",
    minPlayers: 2,
    maxPlayers: 2,
    status: "active",
    category: "classic",
  },
  {
    id: "memory",
    title: "Memory Match",
    subtitle: "Card Flipping Challenge",
    description: "Test your memory! Flip 2 cards at a time and match pairs.",
    icon: "🎴🧠",
    iconPath: "/game-icons/memory.png",
    badgeColor: "from-purple-500 to-indigo-600",
    minPlayers: 2,
    maxPlayers: 2,
    status: "active",
    category: "arcade",
  },
  {
    id: "drawing",
    title: "Drawing Board",
    subtitle: "Couples Doodle & Stamp",
    description: "Create art together in real time! Draw, pick colors, and place blocks.",
    icon: "🎨",
    iconPath: "/game-icons/drawing.png",
    badgeColor: "from-emerald-500 to-teal-600",
    minPlayers: 2,
    maxPlayers: 2,
    status: "active",
    category: "creative",
  },
  {
    id: "quiz",
    title: "Trivia Quiz",
    subtitle: "Fun Knowledge Duel",
    description: "Answer 5 trivia questions together and see who scores highest!",
    icon: "💡❓",
    iconPath: "/game-icons/quiz.png",
    badgeColor: "from-violet-500 to-purple-600",
    minPlayers: 2,
    maxPlayers: 2,
    status: "active",
    category: "trivia",
  },
];

export function getGameDefinition(id: string): TogetherGameDefinition | undefined {
  return GAMES_REGISTRY.find((game) => game.id === id);
}
