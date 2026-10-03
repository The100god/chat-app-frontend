"use client";
import React, { useEffect, useState } from "react";
import {
  Bell,
  User,
  LogOut,
  Lock,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Fingerprint,
  Smartphone,
  RefreshCw,
  Sparkles,
  Check,
  RotateCcw,
  Palette,
} from "lucide-react";
import Image from "next/image";
import { useAtom } from "jotai";
import { useAuth } from "../../context/AuthContext";
import ChangePasswordForm from "../../components/ChangePasswordForm";
import { isMobilePWA, hashPin } from "../../components/AppLockWrapper";
import { showToast } from "../../components/Toast";
import { updateAvailableAtom, animatedBgEnabledAtom, animatedBgTextAtom, animatedBgTextColorAtom } from "../../states/States";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<string | null>();
  const [notifications, setNotifications] = useState(true);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [updatingApp, setUpdatingApp] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateAvailable, setUpdateAvailable] = useAtom(updateAvailableAtom);
  const [animatedBgEnabled, setAnimatedBgEnabled] = useAtom(animatedBgEnabledAtom);
  const [animatedBgText, setAnimatedBgText] = useAtom(animatedBgTextAtom);
  const [animatedBgTextColor, setAnimatedBgTextColor] = useAtom(animatedBgTextColorAtom);
  const [bgDraftText, setBgDraftText] = useState("");
  const [bgDraftTextColor, setBgDraftTextColor] = useState("");

  const handleToggleAnimatedBg = () => {
    const next = !animatedBgEnabled;
    setAnimatedBgEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("animatedBgEnabled", String(next));
    }
    showToast(next ? "Animated background enabled" : "Animated background disabled", "info");
  };

  const handleSaveBgText = () => {
    setAnimatedBgText(bgDraftText);
    setAnimatedBgTextColor(bgDraftTextColor);
    if (typeof window !== "undefined") {
      localStorage.setItem("animatedBgText", bgDraftText);
      localStorage.setItem("animatedBgTextColor", bgDraftTextColor);
    }
    showToast("Background changes saved successfully!", "success");
  };

  const handleResetBgText = () => {
    setBgDraftText("");
    setAnimatedBgText("");
    setBgDraftTextColor("");
    setAnimatedBgTextColor("");
    if (typeof window !== "undefined") {
      localStorage.setItem("animatedBgText", "");
      localStorage.setItem("animatedBgTextColor", "");
    }
    showToast("Reset to default emojis & theme colors", "info");
  };

  const handleSelectPreset = (emojis: string, defaultColor?: string) => {
    setBgDraftText(emojis);
    setAnimatedBgText(emojis);
    if (typeof window !== "undefined") {
      localStorage.setItem("animatedBgText", emojis);
    }
    if (defaultColor !== undefined) {
      setBgDraftTextColor(defaultColor);
      setAnimatedBgTextColor(defaultColor);
      if (typeof window !== "undefined") {
        localStorage.setItem("animatedBgTextColor", defaultColor);
      }
    }
    showToast("Preset theme applied!", "success");
  };

  const handleUpdateApp = async () => {
    setUpdatingApp(true);
    setUpdateMessage("Checking for updates...");

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update().catch(() => { });
        }
      }

      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      setUpdateMessage("Applying latest version...");
      showToast("App updated successfully! Reloading...", "success", 2000);

      setTimeout(() => {
        setUpdateAvailable(false);
        const url = new URL(window.location.href);
        url.searchParams.set("v", String(Date.now()));
        window.location.href = url.toString();
      }, 700);
    } catch (err) {
      console.error("App update failed:", err);
      showToast("App reload in progress...", "info", 2000);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  // App Lock State
  const [appLockModalOpen, setAppLockModalOpen] = useState(false);
  const [appLockTimeout, setAppLockTimeout] = useState(0);
  const [lockSetupStep, setLockSetupStep] = useState<'menu' | 'enter_pin' | 'confirm_pin' | 'bio_prompt'>('menu');
  const [setupTimeoutVal, setSetupTimeoutVal] = useState(0);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirmInput, setPinConfirmInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [bioSupported, setBioSupported] = useState(false);
  const [desktopNoticeOpen, setDesktopNoticeOpen] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [user?.profilePic]);

  const getInitials = (name?: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isImageNotFound = (pic?: string) => {
    if (!pic) return true;
    return (
      pic === "/user.jpg" ||
      pic.includes("default-profile-pic") ||
      pic.includes("encrypted-tbn0.gstatic.com") ||
      pic.trim() === ""
    );
  };

  const handleThemeToggle = (theme: "light" | "dark" | "aurora") => {
    document.documentElement.setAttribute("data-theme", theme);
    setMode(theme);
    localStorage.setItem("chatTheme", theme);
  };
  const handleNotificationToggle = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setNotifications(!notifications);
        showToast(`Notifications ${!notifications ? "enabled" : "disabled"}`, "info");
      } else {
        const result = await Notification.requestPermission();
        if (result === "granted") {
          setNotifications(true);
          showToast("Notification & App Icon Badge permissions granted!", "success");
        } else {
          showToast("Notification permission was denied in browser settings.", "warning");
        }
      }
    } else {
      setNotifications(!notifications);
    }
  };

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("chatTheme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    setMode(savedTheme);

    const savedTimeout = Number(localStorage.getItem("chugliAppLockTimeout")) || 0;
    setAppLockTimeout(savedTimeout);

    const savedBgEnabled = localStorage.getItem("animatedBgEnabled");
    if (savedBgEnabled !== null) {
      setAnimatedBgEnabled(savedBgEnabled !== "false");
    }
    const savedBgText = localStorage.getItem("animatedBgText");
    if (savedBgText !== null) {
      setAnimatedBgText(savedBgText);
      setBgDraftText(savedBgText);
    }
    const savedBgTextColor = localStorage.getItem("animatedBgTextColor");
    if (savedBgTextColor !== null) {
      setAnimatedBgTextColor(savedBgTextColor);
      setBgDraftTextColor(savedBgTextColor);
    }
  }, [setAnimatedBgEnabled, setAnimatedBgText, setAnimatedBgTextColor]);

  const getAppLockStatusText = () => {
    if (appLockTimeout === 0) return "No Lock";
    if (appLockTimeout === -1) return "Immediately";
    if (appLockTimeout === 10) return "10s";
    if (appLockTimeout === 30) return "30s";
    if (appLockTimeout === 300) return "5 min";
    if (appLockTimeout === 1800) return "30 min";
    return "No Lock";
  };

  const handleAppLockClick = () => {
    setLockSetupStep('menu');
    setPinInput("");
    setPinConfirmInput("");
    setPinError("");
    setAppLockModalOpen(true);
  };

  const handleSelectTimeout = (timeoutVal: number) => {
    if (timeoutVal === 0) {
      localStorage.removeItem("chugliAppLockTimeout");
      localStorage.removeItem("chugliAppLockPin");
      localStorage.removeItem("chugliAppLockBioId");
      setAppLockTimeout(0);
      setAppLockModalOpen(false);
      showToast("App Lock disabled successfully!", "success");
    } else {
      setSetupTimeoutVal(timeoutVal);
      setLockSetupStep('enter_pin');
      setPinInput("");
      setPinConfirmInput("");
      setPinError("");
    }
  };

  const handleDialPadPress = (val: string, step: 'enter_pin' | 'confirm_pin') => {
    if (step === 'enter_pin') {
      if (pinInput.length >= 4) return;
      const newPin = pinInput + val;
      setPinInput(newPin);
      setPinError("");
      if (newPin.length === 4) {
        setLockSetupStep('confirm_pin');
      }
    } else {
      if (pinConfirmInput.length >= 4) return;
      const newPin = pinConfirmInput + val;
      setPinConfirmInput(newPin);
      setPinError("");
      if (newPin.length === 4) {
        if (pinInput === newPin) {
          saveLockSettings(newPin);
        } else {
          setPinError("PINs do not match. Restarting setup.");
          setPinInput("");
          setPinConfirmInput("");
          setLockSetupStep('enter_pin');
        }
      }
    }
  };

  const handleDialPadDelete = (step: 'enter_pin' | 'confirm_pin') => {
    if (step === 'enter_pin') {
      setPinInput(pinInput.slice(0, -1));
    } else {
      setPinConfirmInput(pinConfirmInput.slice(0, -1));
    }
  };

  const saveLockSettings = async (finalPin: string) => {
    const hashed = await hashPin(finalPin);
    localStorage.setItem("chugliAppLockPin", hashed);
    localStorage.setItem("chugliAppLockTimeout", String(setupTimeoutVal));
    setAppLockTimeout(setupTimeoutVal);

    if (window.PublicKeyCredential) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          setBioSupported(true);
          setLockSetupStep('bio_prompt');
          return;
        }
      } catch {
        // ignore
      }
    }

    showToast("App Lock enabled successfully!", "success");
    setAppLockModalOpen(false);
  };

  const handleEnableBiometrics = async () => {
    try {
      if (!window.PublicKeyCredential) return;
      const challenge = new Uint8Array(16);
      crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Chugli Chat" },
          user: {
            id: userId,
            name: "chugli-user",
            displayName: "Chugli User",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000
        }
      }) as PublicKeyCredential;

      if (credential) {
        const rawId = new Uint8Array(credential.rawId);
        const hexId = Array.from(rawId).map(b => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem("chugliAppLockBioId", hexId);
        showToast("Biometrics enabled successfully!", "success");
      }
    } catch (err) {
      console.warn("Biometric registration cancelled or failed:", err);
      showToast("Could not enable biometric login. PIN fallback will be used.", "warning");
    } finally {
      setAppLockModalOpen(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("chatAppToken");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/users/deleteAccount`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        localStorage.removeItem("chatAppToken");
        localStorage.removeItem("chatAppUserId");
        window.location.href = "/pages/login";
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to delete account", "error");
      }
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full h-full max-h-full flex flex-col min-h-0 overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="p-4 border-b border-[var(--accent)] flex items-center justify-between flex-shrink-0">
        <h2 className="text-2xl font-semibold">
          Settings
        </h2>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-6 touch-pan-y custom-scrollbar">
        {/* Profile Section */}
        <section>
          <h3 className="text-lg font-bold mb-3">Profile</h3>
          <div className="flex items-center gap-4 bg-[var(--card)] rounded-xl p-4">
            {isImageNotFound(user?.profilePic) || imageError ? (
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] text-white font-bold text-xl border-2 border-[var(--accent)] shadow-inner">
                {getInitials(user?.username)}
              </div>
            ) : (
              <Image
                src={user?.profilePic || "/user.jpg"}
                alt="profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-[var(--accent)]"
                onError={() => setImageError(true)}
                width={64}
                height={64}
              />
            )}
            <div className="flex flex-col">
              <span className="text-xl font-semibold">{user?.username}</span>
              <span className="text-[var(--foreground)]/35 text-sm">
                {user?.email}
              </span>
            </div>
          </div>
          <button
            className="mt-3 px-4 py-2 cursor-pointer bg-[var(--accent)] hover:bg-[var(--accent)]/35 text-[var(--background)] hover:text-[var(--foreground)] border border-[var(--foreground)] hover:border-[var(--accent)] rounded-md text-sm font-medium transition"
            onClick={() => (window.location.href = "/pages/profilePage")}
          >
            Edit Profile
          </button>
        </section>

        {/* Account & Privacy */}
        <section>
          <h3 className="text-lg font-bold mb-3">Account & Privacy</h3>
          <div className="space-y-3">
            <SettingItem
              icon={<Lock />}
              label="Change Password"
              action="Edit"
              className="bg-[var(--card)] hover:bg-[var(--accent)]/15"
              onClick={() => setChangePasswordOpen(true)}
            />
            <SettingItem
              icon={<User />}
              label="Online Status"
              action="Visible"
              onClick={() => showToast("Online status settings coming soon!", "info")}
            />
            <div className="relative">
              <SettingItem
                icon={<ShieldCheck />}
                label="App Lock"
                action={getAppLockStatusText()}
                className="bg-[var(--card)] hover:bg-[var(--accent)]/15"
                onClick={handleAppLockClick}
              />
              {mounted && !isMobilePWA() && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-medium select-none pointer-events-none">
                  <Smartphone className="w-3 h-3" />
                  <span>PWA Mobile Only</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="text-lg font-bold mb-3">Notifications</h3>
          <div className="space-y-3">
            <ToggleItem
              icon={<Bell />}
              label="Message Notifications"
              enabled={notifications}
              onToggle={handleNotificationToggle}
            />
          </div>
        </section>

        {/* Chat Preferences */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold mb-3">Chat Preferences</h3>

          {/* Theme selector */}
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)]/70 uppercase tracking-wider block mb-2">
              Theme
            </label>
            <div className="flex flex-row justify-between items-center space-x-3">
              <button
                className={`flex w-full justify-center items-center cursor-pointer ${mode === "light" ? "bg-[var(--accent)]/15 font-bold" : "bg-[var(--card)]"
                  } hover:bg-[var(--accent)]/15 px-2 py-3 rounded-md border border-[var(--border)] hover:border-[var(--accent)] transition`}
                onClick={() => handleThemeToggle("light")}
              >
                Light
              </button>
              <button
                className={`flex w-full justify-center items-center cursor-pointer ${mode === "dark" ? "bg-[var(--accent)]/15 font-bold" : "bg-[var(--card)]"
                  } hover:bg-[var(--accent)]/15 px-2 py-3 rounded-md border border-[var(--border)] hover:border-[var(--accent)] transition`}
                onClick={() => handleThemeToggle("dark")}
              >
                Dark
              </button>
              <button
                className={`flex w-full justify-center items-center cursor-pointer ${mode === "aurora" ? "bg-[var(--accent)]/15 font-bold" : "bg-[var(--card)]"
                  } hover:bg-[var(--accent)]/15 px-2 py-3 rounded-md border border-[var(--border)] hover:border-[var(--accent)] transition`}
                onClick={() => handleThemeToggle("aurora")}
              >
                Aurora
              </button>
            </div>
          </div>

          {/* Animated Background Toggle & Custom Emojis */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="text-pink-500">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Emoji Background
                  </p>
                  <p className="text-xs text-[var(--foreground)]/60">
                    Floating faint emojis drifting in the background
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleAnimatedBg}
                className={`w-12 h-6 flex items-center rounded-full transition cursor-pointer ${animatedBgEnabled ? "bg-[var(--accent)]" : "bg-gray-400 dark:bg-gray-600"
                  }`}
                title="Toggle Animated Background"
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition ${animatedBgEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                />
              </button>
            </div>

            {animatedBgEnabled && (
              <div className="pt-3 border-t border-[var(--border)] space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/80 block mb-1.5">
                    Custom Emojis or Text
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={bgDraftText}
                      onChange={(e) => setBgDraftText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveBgText();
                        }
                      }}
                      placeholder="e.g. 🌸 💖 ✨ 🔥 or type any words"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--input)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 outline-none focus:border-[var(--accent)] transition select-text"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveBgText}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        title="Save Changes"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                      {(bgDraftText || animatedBgText) && (
                        <button
                          type="button"
                          onClick={handleResetBgText}
                          className="px-3.5 py-2 rounded-xl bg-[var(--muted)] hover:bg-[var(--border)] text-xs font-semibold text-[var(--foreground)] transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                          title="Reset to default emojis"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Text Color Selection */}
                <div className="space-y-2 pt-1 border-t border-[var(--border)]/60">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-[var(--foreground)]/80 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Text Color (Dark & Light Theme):</span>
                    </label>
                    <span className="text-[11px] text-[var(--foreground)]/60 font-mono">
                      {bgDraftTextColor ? bgDraftTextColor.toUpperCase() : "Auto (Adaptive)"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Auto / Default theme chip */}
                    <button
                      type="button"
                      onClick={() => setBgDraftTextColor("")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                        !bgDraftTextColor
                          ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-bold shadow-xs"
                          : "bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]/80 hover:border-[var(--accent)]"
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-gray-300 to-gray-700 border border-white/20 inline-block" />
                      <span>Auto</span>
                    </button>

                    {/* Predefined Color Swatches */}
                    {[
                      { name: "White (Bright on Dark)", hex: "#ffffff" },
                      { name: "Pink", hex: "#f472b6" },
                      { name: "Cyan", hex: "#38bdf8" },
                      { name: "Purple", hex: "#c084fc" },
                      { name: "Gold", hex: "#fbbf24" },
                      { name: "Mint", hex: "#34d399" },
                      { name: "Coral", hex: "#f87171" },
                    ].map((col) => {
                      const isSelected = bgDraftTextColor.toLowerCase() === col.hex.toLowerCase();
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setBgDraftTextColor(col.hex)}
                          className={`w-7 h-7 rounded-full border-2 transition flex items-center justify-center cursor-pointer shadow-xs ${
                            isSelected
                              ? "border-[var(--foreground)] scale-110 shadow-md ring-2 ring-[var(--accent)]/50"
                              : "border-black/20 dark:border-white/20 hover:scale-105"
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                col.hex === "#ffffff" || col.hex === "#fbbf24" ? "text-gray-900" : "text-white"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}

                    {/* Custom Color Picker Input */}
                    <label
                      className={`relative w-7 h-7 rounded-full border-2 cursor-pointer flex items-center justify-center overflow-hidden transition shadow-xs ${
                        bgDraftTextColor && ![
                          "#ffffff", "#f472b6", "#38bdf8", "#c084fc", "#fbbf24", "#34d399", "#f87171"
                        ].includes(bgDraftTextColor.toLowerCase())
                          ? "border-[var(--foreground)] scale-110 shadow-md ring-2 ring-[var(--accent)]/50"
                          : "border-black/20 dark:border-white/20 hover:scale-105"
                      }`}
                      style={{
                        background: bgDraftTextColor && ![
                          "#ffffff", "#f472b6", "#38bdf8", "#c084fc", "#fbbf24", "#34d399", "#f87171"
                        ].includes(bgDraftTextColor.toLowerCase())
                          ? bgDraftTextColor
                          : "conic-gradient(from 180deg at 50% 50%, #f43f5e 0deg, #eab308 90deg, #22c55e 180deg, #06b6d4 270deg, #f43f5e 360deg)",
                      }}
                      title="Custom Color"
                    >
                      <input
                        type="color"
                        value={bgDraftTextColor || "#ffffff"}
                        onChange={(e) => setBgDraftTextColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Preset Chips */}
                <div>
                  <p className="text-[11px] text-[var(--foreground)]/60 mb-1.5 font-medium">
                    Quick Preset Themes:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "💕 Romance", emojis: "🌸 💖 💕 ❤️ 🥰 💌", color: "#f472b6" },
                      { label: "✨ Magic", emojis: "✨ 💫 🌟 🔮 🦋 🌙", color: "#c084fc" },
                      { label: "🔥 Energy", emojis: "🔥 ⚡ 🚀 💥 🎈 🎉", color: "#fbbf24" },
                      { label: "🌸 Spring", emojis: "🌸 🌷 🌺 🌹 🌿 🍃", color: "#34d399" },
                      { label: "🧸 Cute", emojis: "🧸 🐱 🐶 🐼 🍓 🍭", color: "#ffffff" },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSelectPreset(preset.emojis, preset.color)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          (bgDraftText || animatedBgText) === preset.emojis
                            ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-bold"
                            : "bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]/80 hover:border-[var(--accent)]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Storage */}
        <section>
          <h3 className="text-lg font-bold mb-3">Storage & Media</h3>
          <SettingItem
            icon={<Trash2 />}
            label="Clear Media Cache"
            onClick={() => showToast("Media cache cleared successfully!", "success")}
          />
        </section>

        {/* App Updates */}
        <section>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            App Updates & Version
            {updateAvailable && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-bounce">
                New Update Available!
              </span>
            )}
          </h3>
          <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--foreground)]/10 hover:border-[var(--accent)] transition space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative text-[var(--accent)] p-2 bg-[var(--accent)]/10 rounded-full">
                  <RefreshCw className={`w-5 h-5 ${updatingApp ? "animate-spin" : ""}`} />
                  {updateAvailable && (
                    <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold block text-sm sm:text-base text-[var(--foreground)]">
                    Update Application
                  </span>
                  <span className="text-xs text-[var(--foreground)]/60 block mt-0.5">
                    {updateAvailable
                      ? "A new app update is ready! Click Update Now to install."
                      : updateMessage || "Instantly fetch & apply latest app features without uninstalling."}
                  </span>
                </div>
              </div>
              <button
                onClick={handleUpdateApp}
                disabled={updatingApp}
                className={`px-4 py-2 cursor-pointer rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow-sm whitespace-nowrap ${updateAvailable
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : "bg-[var(--accent)] hover:bg-[var(--accent)]/85 text-[var(--background)]"
                  }`}
              >
                {updatingApp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : updateAvailable ? (
                  "Update Now (New)"
                ) : (
                  "Update Now"
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Logout */}
        <section>
          <button
            onClick={logout}
            className="w-full mt-6 flex justify-center items-center cursor-pointer gap-2 bg-red-600 hover:bg-red-700 py-2 rounded-md font-semibold"
          >
            <LogOut size={18} /> Logout
          </button>
        </section>

        {/* Danger Zone — Delete Account */}
        <section>
          <h3 className="text-lg font-bold mb-3 text-red-500">Danger Zone</h3>
          <div
            onClick={() => setDeleteAccountOpen(true)}
            className="flex justify-between items-center bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-800 hover:border-red-500 rounded-lg px-4 py-3 cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={20} />
              <span className="font-medium">Delete Account</span>
            </div>
            <ChevronRight size={16} />
          </div>
          <p className="text-xs text-[var(--foreground)]/40 mt-2">
            This will permanently delete your account, messages, friends, and all data. This action cannot be undone.
          </p>
        </section>
      </div>

      {/* Change Password Modal */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity ${changePasswordOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        <div className="bg-[var(--background)] p-6 rounded-lg shadow-lg w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Change Password</h2>
            <button
              onClick={() => setChangePasswordOpen(false)}
              className="text-[var(--foreground)] text-2xl cursor-pointer hover:text-red-500 transition"
            >
              &times;
            </button>
          </div>
          <ChangePasswordForm onClose={() => setChangePasswordOpen(false)} />
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity ${deleteAccountOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        <div className="bg-[var(--background)] border border-red-800 p-6 rounded-xl shadow-2xl w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-500">Delete Account</h2>
            <button
              onClick={() => {
                setDeleteAccountOpen(false);
                setDeleteConfirmText("");
              }}
              className="text-[var(--foreground)] text-2xl cursor-pointer hover:text-red-500 transition"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-[var(--foreground)]/70 mb-2">
            This action is <strong className="text-red-400">permanent and irreversible</strong>. All your data including messages, friends, and groups will be deleted.
          </p>
          <p className="text-sm text-[var(--foreground)]/70 mb-4">
            Type <strong className="text-red-400 font-mono">DELETE</strong> below to confirm:
          </p>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="w-full px-3 py-2 rounded-md bg-[var(--card)] border border-red-800 text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:border-red-500 mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setDeleteAccountOpen(false);
                setDeleteConfirmText("");
              }}
              className="flex-1 py-2 rounded-md cursor-pointer bg-[var(--card)] border border-[var(--foreground)]/30 hover:bg-[var(--accent)]/15 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || deleting}
              className={`flex-1 py-2 rounded-md cursor-pointer font-semibold text-sm transition ${deleteConfirmText === "DELETE" && !deleting
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-red-900/30 text-red-800 cursor-not-allowed"
                }`}
            >
              {deleting ? "Deleting..." : "Delete My Account"}
            </button>
          </div>
        </div>
      </div>

      {/* App Lock Setup Modal */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity ${appLockModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="bg-[var(--background)] border border-[var(--accent)] p-6 rounded-xl shadow-2xl w-full max-w-sm mx-4 select-none text-[var(--foreground)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-[var(--accent)]" /> Setup App Lock
            </h2>
            <button
              onClick={() => setAppLockModalOpen(false)}
              className="text-[var(--foreground)] text-2xl cursor-pointer hover:text-red-500 transition"
            >
              &times;
            </button>
          </div>

          {/* Step 1: Select Timeout */}
          {lockSetupStep === 'menu' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--foreground)]/75">
                Choose after how long of being idle or in the background Chugli should require authentication:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "No Lock (Disable)", val: 0 },
                  { label: "Immediately", val: -1 },
                  { label: "10 seconds", val: 10 },
                  { label: "30 seconds", val: 30 },
                  { label: "5 minutes", val: 300 },
                  { label: "30 minutes", val: 1800 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => handleSelectTimeout(opt.val)}
                    className={`py-3 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${appLockTimeout === opt.val
                      ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--card)] border-[var(--foreground)]/10 hover:border-[var(--accent)]"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 & 3: Enter and Confirm PIN using Dialpad */}
          {(lockSetupStep === 'enter_pin' || lockSetupStep === 'confirm_pin') && (
            <div className="flex flex-col items-center">
              <p className="text-sm text-[var(--foreground)]/80 text-center mb-4">
                {lockSetupStep === 'enter_pin'
                  ? "Create a 4-digit security PIN for this device:"
                  : "Confirm your 4-digit security PIN:"}
              </p>

              {/* Pin Indicators */}
              <div className="flex gap-4 mb-6">
                {[0, 1, 2, 3].map((index) => {
                  const active =
                    lockSetupStep === 'enter_pin'
                      ? pinInput.length > index
                      : pinConfirmInput.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${active
                        ? "bg-[var(--accent)] border-[var(--accent)] scale-110 shadow-[0_0_8px_var(--accent)]"
                        : "border-gray-600 bg-transparent"
                        }`}
                    />
                  );
                })}
              </div>

              {/* Error Message */}
              {pinError && <p className="text-red-500 text-sm font-semibold mb-4">{pinError}</p>}

              {/* Setup Dial Pad */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-[220px] mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleDialPadPress(num.toString(), lockSetupStep)}
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg font-bold hover:bg-[var(--accent)]/20 active:scale-95 transition cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handleDialPadPress("0", lockSetupStep)}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg font-bold hover:bg-[var(--accent)]/20 active:scale-95 transition cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={() => handleDialPadDelete(lockSetupStep)}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 active:scale-95 transition cursor-pointer text-gray-300"
                >
                  ⌫
                </button>
              </div>

              <button
                onClick={() => setLockSetupStep('menu')}
                className="mt-2 text-sm text-[var(--accent)] hover:underline cursor-pointer"
              >
                Back to Options
              </button>
            </div>
          )}

          {/* Step 4: Biometric Setup Request */}
          {lockSetupStep === 'bio_prompt' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center border border-[var(--accent)]">
                  <Fingerprint className="w-8 h-8 text-[var(--accent)]" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">Enable Biometric Login?</h3>
              <p className="text-sm text-[var(--foreground)]/70">
                Your device supports biometric verification. Would you like to enable FaceID, TouchID, or fingerprint verification to unlock Chugli instantly?
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    showToast("App Lock setup completed (PIN only).", "success");
                    setAppLockModalOpen(false);
                  }}
                  className="flex-1 py-2 rounded-md bg-[var(--card)] border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/5 text-sm font-semibold transition cursor-pointer"
                >
                  PIN Only
                </button>
                <button
                  onClick={handleEnableBiometrics}
                  className="flex-1 py-2 rounded-md bg-[var(--accent)] text-[var(--background)] hover:bg-[var(--accent)]/90 text-sm font-semibold transition cursor-pointer"
                >
                  Enable Biometrics
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop warning popup */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity ${desktopNoticeOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="bg-[var(--background)] border border-yellow-500/30 p-6 rounded-xl shadow-2xl w-full max-w-sm mx-4 text-center text-[var(--foreground)]">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20 text-yellow-500">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Mobile App Feature</h2>
          <p className="text-sm text-[var(--foreground)]/70 mb-5 leading-relaxed">
            App Lock is designed specifically for **installed mobile apps (PWA)** to protect your chats on iOS or Android.
            <br /><br />
            To use it:
            1. Open Chugli in your mobile browser.
            2. Choose **"Install Chugli"** from the menu.
            3. Open the app from your home screen and configure the App Lock settings.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setDesktopNoticeOpen(false);
                setLockSetupStep('menu');
                setPinInput("");
                setPinConfirmInput("");
                setPinError("");
                setAppLockModalOpen(true);
              }}
              className="flex-1 py-2 rounded-md bg-[var(--card)] hover:bg-[var(--accent)]/15 border border-[var(--foreground)]/10 text-xs font-semibold transition cursor-pointer"
            >
              Setup Anyway (Preview)
            </button>
            <button
              onClick={() => setDesktopNoticeOpen(false)}
              className="flex-1 py-2 rounded-md bg-[var(--accent)] text-[var(--background)] hover:bg-[var(--accent)]/95 text-xs font-semibold transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  action?: string;
  className?: string;
  onClick?: () => void;
}

function SettingItem({ icon, label, action, onClick, className }: SettingItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex justify-between items-center text-[var(--foreground)] border border-[var(--foreground)] hover:border-[var(--accent)] rounded-lg px-4 py-3 cursor-pointer ${className || "bg-[var(--card)] hover:bg-[var(--accent)]/15"}`}
    >
      <div className="flex items-center gap-3">
        <div className="text-lime-400">{icon}</div>
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1 text-gray-400 text-sm">
        {action && <span>{action}</span>}
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

interface ToggleItemProps {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

function ToggleItem({ icon, label, enabled, onToggle }: ToggleItemProps) {
  return (
    <div className="flex justify-between items-center cursor-pointer bg-[var(--card)] hover:bg-[var(--accent)]/15 border border-[var(--foreground)] hover:border-[var(--accent)] rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="text-lime-400">{icon}</div>
        <span>{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 flex items-center rounded-full transition ${enabled ? "bg-[var(--accent)]" : "bg-gray-500"
          }`}
      >
        <div
          className={`w-5 h-5 bg-[var(--background)] rounded-full shadow transform transition ${enabled ? "translate-x-6" : "translate-x-1"
            }`}
        />
      </button>
    </div>
  );
}
