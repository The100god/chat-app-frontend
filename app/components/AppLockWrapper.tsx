"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Lock, Fingerprint, Delete } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper to hash PIN securely using SHA-256 via Web Crypto API
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Check if running on mobile standalone PWA
export function isMobilePWA(): boolean {
  if (typeof window === "undefined") return false;

  // Bypass PWA mobile restriction on localhost for local testing
  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.");
  if (isLocalDev) return true;

  const isPwa = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isPwa && isMobile;
}

export default function AppLockWrapper({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [bioAvailable, setBioAvailable] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const lastActiveTimeRef = useRef<number>(Date.now());
  const isPwaMobileActive = useRef<boolean>(false);

  // Initialize checks
  useEffect(() => {
    isPwaMobileActive.current = isMobilePWA();

    // Check if biometric is available on this device
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => setBioAvailable(available))
        .catch(() => setBioAvailable(false));
    }

    const savedTimeout = Number(localStorage.getItem("chugliAppLockTimeout")) || 0;
    const savedPinHash = localStorage.getItem("chugliAppLockPin");

    // Lock immediately on fresh launch if App Lock is enabled
    if (isPwaMobileActive.current && savedTimeout !== 0 && savedPinHash) {
      setIsLocked(true);
    }
  }, []);

  // Biometric authentication trigger
  const triggerBiometricUnlock = useCallback(async () => {
    const savedBioId = localStorage.getItem("chugliAppLockBioId");
    if (!savedBioId || !window.PublicKeyCredential) return;

    try {
      const rawId = new Uint8Array(
        savedBioId.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );
      const challenge = new Uint8Array(16);
      crypto.getRandomValues(challenge);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              type: "public-key",
              id: rawId,
            },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      });

      if (assertion) {
        setIsLocked(false);
        setPin("");
        setErrorMsg("");
      }
    } catch (err) {
      console.warn("Biometric unlock failed or cancelled:", err);
    }
  }, []);

  // Auto trigger biometrics when lock screen mounts
  useEffect(() => {
    if (isLocked) {
      // Small timeout to let UI mount
      const timer = setTimeout(() => {
        triggerBiometricUnlock();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLocked, triggerBiometricUnlock]);

  // Visibility state listener (minimizing PWA / locking mobile screen)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const savedTimeout = Number(localStorage.getItem("chugliAppLockTimeout")) || 0;
      const savedPinHash = localStorage.getItem("chugliAppLockPin");

      if (!isPwaMobileActive.current || savedTimeout === 0 || !savedPinHash) {
        return;
      }

      if (document.visibilityState === "hidden") {
        lastActiveTimeRef.current = Date.now();
      } else if (document.visibilityState === "visible") {
        if (isLocked) return;

        const elapsed = (Date.now() - lastActiveTimeRef.current) / 1000;
        if (savedTimeout === -1) {
          // Lock Immediately
          setIsLocked(true);
        } else if (savedTimeout > 0 && elapsed >= savedTimeout) {
          setIsLocked(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLocked]);

  // Handle PIN button press
  const handleKeyPress = async (num: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);
    setErrorMsg("");

    if (newPin.length === 4) {
      const savedPinHash = localStorage.getItem("chugliAppLockPin");
      if (savedPinHash) {
        const inputHash = await hashPin(newPin);
        if (inputHash === savedPinHash) {
          setIsLocked(false);
          setPin("");
          setErrorMsg("");
        } else {
          // Vibrate if supported
          if ("vibrate" in navigator) {
            navigator.vibrate(200);
          }
          setErrorMsg("Incorrect PIN. Please try again.");
          setPin("");
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setErrorMsg("");
  };

  return (
    <>
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 select-none"
          >
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-10 text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center border border-[var(--accent)] mb-4"
              >
                <Lock className="w-8 h-8 text-[var(--accent)]" />
              </motion.div>
              <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-white via-gray-300 to-[var(--accent)] bg-clip-text text-transparent">
                Chugli Locked
              </h1>
              <p className="text-gray-400 text-sm mt-1">App Lock is active</p>
            </div>

            {/* PIN indicators */}
            <div className="flex gap-6 mb-8 justify-center items-center h-6">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    pin.length > index
                      ? "bg-[var(--accent)] border-[var(--accent)] scale-110 shadow-[0_0_8px_var(--accent)]"
                      : "border-gray-600 bg-transparent"
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            <div className="h-6 text-red-500 text-sm font-semibold mb-6">
              {errorMsg}
            </div>

            {/* Dialpad Grid */}
            <div className="grid grid-cols-3 gap-6 max-w-xs w-full mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num.toString())}
                  className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-bold hover:bg-[var(--accent)]/20 active:scale-95 hover:border-[var(--accent)]/30 transition duration-150 cursor-pointer"
                >
                  {num}
                </button>
              ))}

              {/* Biometrics option or Empty */}
              <div className="flex items-center justify-center">
                {bioAvailable && localStorage.getItem("chugliAppLockBioId") ? (
                  <button
                    onClick={triggerBiometricUnlock}
                    className="w-16 h-16 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center hover:bg-[var(--accent)]/30 active:scale-95 transition duration-150 cursor-pointer"
                    title="Unlock with Biometrics"
                  >
                    <Fingerprint className="w-8 h-8 text-[var(--accent)]" />
                  </button>
                ) : (
                  <div className="w-16 h-16" />
                )}
              </div>

              {/* Zero */}
              <button
                onClick={() => handleKeyPress("0")}
                className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-bold hover:bg-[var(--accent)]/20 active:scale-95 hover:border-[var(--accent)]/30 transition duration-150 cursor-pointer"
              >
                0
              </button>

              {/* Backspace */}
              <button
                onClick={handleBackspace}
                className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 active:scale-95 hover:border-red-500/30 transition duration-150 cursor-pointer"
                title="Delete last digit"
              >
                <Delete className="w-6 h-6 text-gray-300" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Content - Hidden or Blurred while locked */}
      <div className={isLocked ? "blur-md pointer-events-none select-none" : ""}>
        {children}
      </div>
    </>
  );
}
