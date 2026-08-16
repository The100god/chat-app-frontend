"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TogetherRoom,
  CatchPartnerState,
  CatchPartnerPlayer,
} from "../../states/togetherTypes";
import {
  Trophy,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  ArrowRightLeft,
  Flame,
  Shield,
  Clock,
  Sparkles,
  Gamepad2,
} from "lucide-react";

interface CatchMyPartnerBoardProps {
  room: TogetherRoom;
  currentUserId: string;
  onEmit: (event: string, payload: any) => void;
  onLeaveRoom?: () => void;
}

// ─── Web Audio API Sound Synthesizer ───
class SoundFX {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Lazy initialize on user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  public setMuted(muted: boolean) {
    this.enabled = !muted;
  }

  public isMuted() {
    return !this.enabled;
  }

  public playBeep(freq = 440, duration = 0.1, type: OscillatorType = "sine") {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay restrictions catch
    }
  }

  public playTagSound() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch { }
  }

  public playBoostSound() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch { }
  }

  public playWinJingle() {
    if (!this.enabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playBeep(freq, 0.2, "triangle"), idx * 120);
    });
  }
}

const sfx = new SoundFX();

// ─── Particle System Interface ───
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export const CatchMyPartnerBoard: React.FC<CatchMyPartnerBoardProps> = ({
  room,
  currentUserId,
  onEmit,
  onLeaveRoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sound Mute State
  const [muted, setMuted] = useState(false);

  // Local Controls State
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchDirection = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMobileBoostPressed = useRef<boolean>(false);

  // Client-Side Smooth Interpolation state (lerp)
  const renderPosRef = useRef<{
    [userId: string]: { x: number; y: number; vx: number; vy: number };
  }>({});

  // Visual Particle System ref
  const particlesRef = useRef<Particle[]>([]);

  // Socket tick throttle timer
  const lastSocketEmitRef = useRef<number>(0);
  const prevRoundRef = useRef<number | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Active D-Pad Touch Directions for lag-free multi-touch
  const activeTouchDirs = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const gameState = room.state.catchPartner as CatchPartnerState | undefined;

  const isHost = room.hostId === currentUserId;
  const participants = room.participants || [];
  const partnerId = participants.find((id) => id !== currentUserId) || "";

  // Session Stats calculation
  const stats = room.sessionStats?.[currentUserId] || {
    wins: 0,
    losses: 0,
    ties: 0,
    total: 0,
  };

  const myRole = gameState?.roles?.catcher === currentUserId ? "catcher" : "runner";
  const isCatcher = myRole === "catcher";

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    sfx.setMuted(nextMuted);
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", " "].includes(
          e.key
        )
      ) {
        keysPressed.current[e.key.toLowerCase()] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", " "].includes(
          e.key
        )
      ) {
        keysPressed.current[e.key.toLowerCase()] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Trigger Sound FX on round result
  useEffect(() => {
    if (gameState?.status === "round_ended" && gameState?.roundResult) {
      if (gameState.roundResult.winnerId === currentUserId) {
        sfx.playWinJingle();
      } else {
        sfx.playTagSound();
      }
    }
  }, [gameState?.status, gameState?.roundResult, currentUserId]);

  // Synchronize player rendering positions whenever round or status changes
  useEffect(() => {
    if (!gameState) return;

    const roundChanged = prevRoundRef.current !== gameState.round;
    const statusChanged = prevStatusRef.current !== gameState.status;

    if (roundChanged || statusChanged) {
      // Hard-reset local render position cache to match server state
      const newRenderPos: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
      for (const pId of Object.keys(gameState.players)) {
        const pData = gameState.players[pId];
        newRenderPos[pId] = { x: pData.x, y: pData.y, vx: 0, vy: 0 };
      }
      renderPosRef.current = newRenderPos;
      particlesRef.current = [];
      touchDirection.current = { x: 0, y: 0 };
      lastSocketEmitRef.current = 0;
    }

    prevRoundRef.current = gameState.round;
    prevStatusRef.current = gameState.status;
  }, [gameState?.round, gameState?.status, gameState?.players]);

  // Main 60fps Canvas Render & Lag-Free Movement Predictor Loop
  useEffect(() => {
    let animFrameId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // 1. Draw Arena Background (Cyber Neon Grid)
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 800, 600);

      // Grid Lines
      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < 800; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 600);
        ctx.stroke();
      }
      for (let y = 0; y < 600; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
      }

      if (!gameState || !gameState.players) {
        animFrameId = requestAnimationFrame(render);
        return;
      }

      // 2. Draw Obstacles
      const obstacles = gameState.obstacles || [];
      for (const obs of obstacles) {
        // Drop shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(obs.x + 4, obs.y + 4, obs.w, obs.h);

        // Gradient Box
        const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y + obs.h);
        grad.addColorStop(0, "#1e293b");
        grad.addColorStop(1, "#0f172a");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 8);
        ctx.fill();

        // Neon Border
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      // 3. Draw PowerUps
      const powerUps = gameState.powerUps || [];
      const nowTime = Date.now();
      for (const pu of powerUps) {
        const pulse = Math.sin(nowTime / 150) * 3;
        ctx.fillStyle = pu.type === "speed" ? "#f59e0b" : "#10b981";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, 10 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Icon inside powerup
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pu.type === "speed" ? "⚡" : "🛡️", pu.x, pu.y);
      }

      // 4. Update Local Input & Predict Movement if Playing
      if (gameState.status === "playing") {
        const keys = keysPressed.current;
        let moveX = 0;
        let moveY = 0;

        if (keys["w"] || keys["arrowup"]) moveY -= 1;
        if (keys["s"] || keys["arrowdown"]) moveY += 1;
        if (keys["a"] || keys["arrowleft"]) moveX -= 1;
        if (keys["d"] || keys["arrowright"]) moveX += 1;

        // Mobile touch input override
        if (touchDirection.current.x !== 0 || touchDirection.current.y !== 0) {
          moveX = touchDirection.current.x;
          moveY = touchDirection.current.y;
        }

        const isRunner = !isCatcher;
        const isBoosting = keys[" "] || isMobileBoostPressed.current;
        const baseSpeed = isRunner ? 8.4 : 4.2;
        const boostSpeed = isRunner ? 14.0 : 7.0;
        const speed = isBoosting ? boostSpeed : baseSpeed;

        const myPlayer = gameState.players[currentUserId];
        if (myPlayer) {
          if (!renderPosRef.current[currentUserId]) {
            renderPosRef.current[currentUserId] = {
              x: myPlayer.x,
              y: myPlayer.y,
              vx: 0,
              vy: 0,
            };
          }

          const localPos = renderPosRef.current[currentUserId];

          if (moveX !== 0 || moveY !== 0) {
            const length = Math.hypot(moveX, moveY) || 1;
            const normX = moveX / length;
            const normY = moveY / length;

            let nextX = localPos.x + normX * speed;
            let nextY = localPos.y + normY * speed;

            // Bounds check
            const radius = 18;
            nextX = Math.max(radius, Math.min(800 - radius, nextX));
            nextY = Math.max(radius, Math.min(600 - radius, nextY));

            // Obstacle collision check (slide response)
            for (const obs of obstacles) {
              const closestX = Math.max(obs.x, Math.min(nextX, obs.x + obs.w));
              const closestY = Math.max(obs.y, Math.min(nextY, obs.y + obs.h));
              const distX = nextX - closestX;
              const distY = nextY - closestY;
              const dist = Math.hypot(distX, distY);

              if (dist < radius) {
                const overlap = radius - dist;
                if (dist > 0) {
                  nextX += (distX / dist) * overlap;
                  nextY += (distY / dist) * overlap;
                } else {
                  nextX += radius;
                }
              }
            }

            localPos.x = nextX;
            localPos.y = nextY;
            localPos.vx = normX * speed;
            localPos.vy = normY * speed;

            // Spawn movement particles
            if (Math.random() < 0.6) {
              particlesRef.current.push({
                x: localPos.x - normX * 12 + (Math.random() - 0.5) * 6,
                y: localPos.y - normY * 12 + (Math.random() - 0.5) * 6,
                vx: -normX * 1.5 + (Math.random() - 0.5),
                vy: -normY * 1.5 + (Math.random() - 0.5),
                life: 0,
                maxLife: isBoosting ? 20 : 12,
                size: isBoosting ? 6 : 4,
                color: isCatcher ? "#ef4444" : "#10b981",
              });
            }

            // Socket Controlled Throttle (Send at 20Hz ~ 50ms)
            if (gameState.status === "playing" && nowTime - lastSocketEmitRef.current > 45) {
              onEmit("together:catchpartner:move", {
                roomId: room.roomId,
                position: {
                  x: Math.round(localPos.x),
                  y: Math.round(localPos.y),
                  isBoosting,
                },
              });
              lastSocketEmitRef.current = nowTime;
            }
          }
        }
      }

      // 5. Lerp Remote Partner Position & Draw Players
      const playerIds = Object.keys(gameState.players);
      for (const pId of playerIds) {
        const pData = gameState.players[pId];
        if (!renderPosRef.current[pId]) {
          renderPosRef.current[pId] = { x: pData.x, y: pData.y, vx: 0, vy: 0 };
        }

        const renderP = renderPosRef.current[pId];

        // Smooth Lerp for remote player or server corrections
        if (pId !== currentUserId) {
          const lerpFactor = 0.25; // 25% smooth interpolation step
          renderP.x += (pData.x - renderP.x) * lerpFactor;
          renderP.y += (pData.y - renderP.y) * lerpFactor;
        }

        const role = pData.role || (pId === gameState.roles.catcher ? "catcher" : "runner");
        const isPlayerCatcher = role === "catcher";
        const isSelf = pId === currentUserId;

        // Outer Aura Glow
        ctx.shadowColor = isPlayerCatcher ? "#ef4444" : "#10b981";
        ctx.shadowBlur = pData.isBoosting ? 22 : 14;

        // Player Circle Body
        ctx.fillStyle = isPlayerCatcher ? "#f43f5e" : "#10b981";
        ctx.beginPath();
        ctx.arc(renderP.x, renderP.y, 18, 0, Math.PI * 2);
        ctx.fill();

        // Inner Ring
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.shadowBlur = 0; // reset blur

        // Direction / Role Icon Badge
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isPlayerCatcher ? "🔥" : "⚡", renderP.x, renderP.y);

        // Player Name Label Overlay above avatar
        ctx.fillStyle = isSelf ? "#fde047" : "#e2e8f0";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(isSelf ? "YOU" : "PARTNER", renderP.x, renderP.y - 26);
      }

      // 6. Update & Draw Particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;

        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) return false;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        return p.life < p.maxLife;
      });

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [gameState, currentUserId, onEmit, room.roomId, isCatcher]);

  // Handle Mobile D-Pad Touch & Mouse Events with preventDefault & Multi-Touch Support
  const updateTouchDirection = () => {
    let dx = 0;
    let dy = 0;
    if (activeTouchDirs.current.up) dy -= 1;
    if (activeTouchDirs.current.down) dy += 1;
    if (activeTouchDirs.current.left) dx -= 1;
    if (activeTouchDirs.current.right) dx += 1;
    touchDirection.current = { x: dx, y: dy };
  };

  const handleTouchDirStart = (dir: "up" | "down" | "left" | "right", e?: React.SyntheticEvent) => {
    if (e && e.cancelable) e.preventDefault();
    activeTouchDirs.current[dir] = true;
    updateTouchDirection();
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const handleTouchDirEnd = (dir?: "up" | "down" | "left" | "right", e?: React.SyntheticEvent) => {
    if (e && e.cancelable) e.preventDefault();
    if (dir) {
      activeTouchDirs.current[dir] = false;
    } else {
      activeTouchDirs.current = { up: false, down: false, left: false, right: false };
    }
    updateTouchDirection();
  };

  const handleTouchBoostStart = (e: React.SyntheticEvent) => {
    if (e && e.cancelable) e.preventDefault();
    isMobileBoostPressed.current = true;
    sfx.playBoostSound();
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  const handleTouchBoostEnd = (e?: React.SyntheticEvent) => {
    if (e && e.cancelable) e.preventDefault();
    isMobileBoostPressed.current = false;
  };

  // Actions handlers
  const handleStartGame = () => {
    onEmit("together:catchpartner:start", { roomId: room.roomId });
    sfx.playBeep(600, 0.15);
  };

  const handleSwapFirstRole = (firstCatcherId: string) => {
    onEmit("together:catchpartner:swapFirstRole", {
      roomId: room.roomId,
      firstCatcherId,
    });
  };

  const handleNextRound = () => {
    onEmit("together:catchpartner:nextRound", { roomId: room.roomId });
  };

  const handleRestartGame = () => {
    onEmit("together:catchpartner:restart", { roomId: room.roomId });
  };

  return (
    <div className="flex flex-col items-center w-full gap-3 select-none">
      {/* Session Stats Bar */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
            <Trophy size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-[var(--foreground)] block">
              Pakdam Pakdai
            </span>
            <span className="text-[10px] text-[var(--foreground)] opacity-60">
              Live Arena
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-lg font-bold">
            <span>W:</span>
            <span>{stats.wins}</span>
          </div>
          <div className="flex items-center gap-1 bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-lg font-bold">
            <span>L:</span>
            <span>{stats.losses}</span>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg font-bold">
            <span>T:</span>
            <span>{stats.ties}</span>
          </div>
        </div>

        {/* <button
          onClick={handleToggleMute}
          className="p-1.5 rounded-lg bg-[var(--muted)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition cursor-pointer"
          title={muted ? "Unmute SFX" : "Mute SFX"}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button> */}
      </div>

      {/* Main Game Header */}
      {gameState && (
        <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-2 sm:p-3 flex items-center justify-between gap-1.5 shadow-md text-xs">
          {/* Round & Role Status */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[11px] sm:text-xs">
              {gameState.round}/{gameState.maxRounds}
            </span>

            <div
              className={`flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-xl font-bold text-[11px] sm:text-xs ${isCatcher
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                }`}
            >
              {isCatcher ? <Flame size={13} /> : <Zap size={13} />}
              <span>{isCatcher ? "CATCHER 🎯" : "RUNNER ⚡"}</span>
            </div>
          </div>

          {/* Live Timer Countdown */}
          <div className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-xl font-extrabold text-[11px] sm:text-xs ${gameState.timer <= 10
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]"
                }`}
            >
              <Clock size={13} />
              <span>00:{gameState.timer < 10 ? `0${gameState.timer}` : gameState.timer}</span>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Viewport Box */}
      <div className="relative w-full aspect-square sm:aspect-4/3 max-h-[62vh] sm:max-h-none bg-slate-950 rounded-2xl border-2 border-[var(--accent)]/40 overflow-hidden shadow-2xl flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full object-contain block"
        />

        {/* Setup Overlay before game starts */}
        <AnimatePresence>
          {gameState?.status === "setup" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 text-center gap-2.5 sm:gap-4 z-20 overflow-y-auto"
            >
              <div className="p-2 sm:p-3 rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                <Gamepad2 size={24} className="sm:w-8 sm:h-8" />
              </div>

              <div className="space-y-1 max-w-xs sm:max-w-sm">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Pakdam Pakdai
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-tight">
                  {isCatcher
                    ? "You are starting as the Catcher! Catch your partner before time runs out."
                    : "You are starting as the Runner! Escape your partner until time expires."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-1">
                <button
                  onClick={() => handleSwapFirstRole(partnerId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  <ArrowRightLeft size={13} />
                  Swap Starting Role
                </button>

                <button
                  onClick={handleStartGame}
                  className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-bold shadow-lg transition cursor-pointer"
                >
                  <Play size={14} />
                  Start Round
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Round Ended & Match Finished Overlay */}
        <AnimatePresence>
          {(gameState?.status === "round_ended" || gameState?.status === "finished") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 text-center gap-2 sm:gap-3 z-20 overflow-y-auto"
            >
              <div className="p-2 sm:p-3 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-bounce">
                <Trophy size={16} className="sm:w-9 sm:h-9" />
              </div>

              <div className="space-y-1 max-w-xs sm:max-w-sm">
                <h3 className="text-sm sm:text-xl font-extrabold text-white">
                  {gameState.status === "finished"
                    ? gameState.winner === currentUserId
                      ? "MATCH VICTORY!"
                      : gameState.winner
                        ? "MATCH DEFEAT"
                        : "MATCH TIE!"
                    : gameState.roundResult?.winnerId === currentUserId
                      ? "ROUND WON!"
                      : "ROUND LOST!"}
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                  {gameState.roundResult?.reason || "Round Completed!"}
                </p>
              </div>

              {/* Scoreboard */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 text-xs text-white">
                <div className="text-center">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block">YOU</span>
                  <span className="text-base sm:text-lg font-bold text-[var(--accent)]">
                    {gameState.scores[currentUserId] || 0}
                  </span>
                </div>
                <span className="text-slate-600 font-bold text-xs">- VS -</span>
                <div className="text-center">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block">PARTNER</span>
                  <span className="text-base sm:text-lg font-bold text-rose-400">
                    {gameState.scores[partnerId] || 0}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-1">
                {gameState.status === "round_ended" ? (
                  <button
                    onClick={handleNextRound}
                    className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-lg hover:opacity-90 transition cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    Next Round
                  </button>
                ) : (
                  <button
                    onClick={handleRestartGame}
                    className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-lg hover:opacity-90 transition cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    Rematch Match
                  </button>
                )}

                {onLeaveRoom && (
                  <button
                    onClick={onLeaveRoom}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    Switch Game
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Controls Overlay (Visible on Touch Screen viewports) */}
      <div className="w-full flex items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-2xl p-2.5 shadow-md sm:hidden touch-none select-none">
        {/* Sprint / Speed Boost Button */}
        <button
          onTouchStart={handleTouchBoostStart}
          onTouchEnd={handleTouchBoostEnd}
          onTouchCancel={handleTouchBoostEnd}
          onMouseDown={handleTouchBoostStart}
          onMouseUp={handleTouchBoostEnd}
          onMouseLeave={handleTouchBoostEnd}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-red-600 text-white font-extrabold text-xs shadow-xl active:scale-90 transition-transform flex flex-col items-center justify-center gap-0.5 border-2 border-amber-300/50 cursor-pointer"
        >
          <Zap size={20} className="animate-pulse" />
          <span className="text-[10px] tracking-wider">BOOST</span>
        </button>

        {/* Virtual D-Pad */}
        <div className="grid grid-cols-3 gap-1 w-32 h-32">
          <div />
          <button
            onTouchStart={(e) => handleTouchDirStart("up", e)}
            onTouchEnd={(e) => handleTouchDirEnd("up", e)}
            onTouchCancel={(e) => handleTouchDirEnd("up", e)}
            onMouseDown={(e) => handleTouchDirStart("up", e)}
            onMouseUp={(e) => handleTouchDirEnd("up", e)}
            onMouseLeave={(e) => handleTouchDirEnd("up", e)}
            className="bg-[var(--muted)] border border-[var(--border)] active:bg-[var(--accent)] rounded-xl flex items-center justify-center text-base font-bold text-[var(--foreground)] active:scale-95 transition-transform"
          >
            ▲
          </button>
          <div />

          <button
            onTouchStart={(e) => handleTouchDirStart("left", e)}
            onTouchEnd={(e) => handleTouchDirEnd("left", e)}
            onTouchCancel={(e) => handleTouchDirEnd("left", e)}
            onMouseDown={(e) => handleTouchDirStart("left", e)}
            onMouseUp={(e) => handleTouchDirEnd("left", e)}
            onMouseLeave={(e) => handleTouchDirEnd("left", e)}
            className="bg-[var(--muted)] border border-[var(--border)] active:bg-[var(--accent)] rounded-xl flex items-center justify-center text-base font-bold text-[var(--foreground)] active:scale-95 transition-transform"
          >
            ◀
          </button>
          <div className="bg-[var(--muted)]/40 rounded-xl flex items-center justify-center text-[9px] opacity-40 font-bold">
            PAD
          </div>
          <button
            onTouchStart={(e) => handleTouchDirStart("right", e)}
            onTouchEnd={(e) => handleTouchDirEnd("right", e)}
            onTouchCancel={(e) => handleTouchDirEnd("right", e)}
            onMouseDown={(e) => handleTouchDirStart("right", e)}
            onMouseUp={(e) => handleTouchDirEnd("right", e)}
            onMouseLeave={(e) => handleTouchDirEnd("right", e)}
            className="bg-[var(--muted)] border border-[var(--border)] active:bg-[var(--accent)] rounded-xl flex items-center justify-center text-base font-bold text-[var(--foreground)] active:scale-95 transition-transform"
          >
            ▶
          </button>

          <div />
          <button
            onTouchStart={(e) => handleTouchDirStart("down", e)}
            onTouchEnd={(e) => handleTouchDirEnd("down", e)}
            onTouchCancel={(e) => handleTouchDirEnd("down", e)}
            onMouseDown={(e) => handleTouchDirStart("down", e)}
            onMouseUp={(e) => handleTouchDirEnd("down", e)}
            onMouseLeave={(e) => handleTouchDirEnd("down", e)}
            className="bg-[var(--muted)] border border-[var(--border)] active:bg-[var(--accent)] rounded-xl flex items-center justify-center text-base font-bold text-[var(--foreground)] active:scale-95 transition-transform"
          >
            ▼
          </button>
          <div />
        </div>


      </div>

      {/* Control Help Keyboard Bar for Desktop */}
      <div className="hidden sm:flex items-center justify-between w-full text-[11px] text-[var(--foreground)] opacity-70 bg-[var(--muted)]/50 px-4 py-2 rounded-xl border border-[var(--border)]">
        <span>
          🎮 Controls: <kbd className="px-1.5 py-0.5 bg-[var(--card)] border rounded text-[10px]">W</kbd>{" "}
          <kbd className="px-1.5 py-0.5 bg-[var(--card)] border rounded text-[10px]">A</kbd>{" "}
          <kbd className="px-1.5 py-0.5 bg-[var(--card)] border rounded text-[10px]">S</kbd>{" "}
          <kbd className="px-1.5 py-0.5 bg-[var(--card)] border rounded text-[10px]">D</kbd> or{" "}
          <kbd className="px-1.5 py-0.5 bg-[var(--card)] border rounded text-[10px]">Arrows</kbd> to move.
        </span>
        <span>
          ⚡ Sprint: <kbd className="px-2 py-0.5 bg-[var(--card)] border rounded text-[10px]">Spacebar</kbd>
        </span>
      </div>
    </div>
  );
};

export default CatchMyPartnerBoard;
