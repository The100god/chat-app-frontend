//@typescript-eslint/no-unused-vars
"use client";
import { useAuth } from "../context/AuthContext";

import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { disconnectSocket } from "../hooks/useSocket";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { floatingEmojisAtom } from "../states/States";
import { Eye, EyeClosed, Loader2, Check, AlertCircle, Lock, AtSign, User as UserIcon } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useSearchParams } from "next/navigation";

interface AuthFormProps {
  type: "signup" | "login";
}

interface GooglePromptState {
  open: boolean;
  googleToken: string;
  email: string;
  name: string;
  picture?: string;
  username: string;
  checking: boolean;
  available?: boolean;
  error?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const [formData, setFormData] = useState<{
    username: string;
    name: string;
    email: string;
    password: string;
  }>({
    username: "",
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [varUserId, setVarUserId] = useState<string | null>(null);
  const { login } = useAuth();
  const [floatingEmojis] = useAtom(floatingEmojisAtom);
  const [seePassword, setSeePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Username validation & availability state for signup
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Google OAuth popup modal state for choosing a permanent username
  const [googlePrompt, setGooglePrompt] = useState<GooglePromptState | null>(null);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("chatTheme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "failed") setMessage("❌ Verification link expired.");
    else if (verified === "already") setMessage("✅ Email already verified.");
  }, [searchParams]);

  useEffect(() => {
    if (varUserId) {
      console.log("🔗 Socket connected for user:");
      return () => {
        disconnectSocket();
        console.log("🔌 Socket disconnected");
      };
    }
  }, [varUserId]);

  // Check username availability against backend
  const checkUsernameAvailability = useCallback(async (candidate: string, isGoogle = false) => {
    const clean = candidate.toLowerCase().trim();
    const regex = /^[a-z0-9_]{3,30}$/;

    if (!clean) {
      if (isGoogle) setGooglePrompt((prev) => prev ? { ...prev, checking: false, available: undefined, error: undefined } : null);
      else setUsernameStatus({ checking: false });
      return;
    }

    if (!regex.test(clean)) {
      const msg = "Must be 3-30 characters (lowercase letters, numbers, _ only)";
      if (isGoogle) {
        setGooglePrompt((prev) => prev ? { ...prev, checking: false, available: false, error: msg } : null);
      } else {
        setUsernameStatus({ checking: false, available: false, message: msg });
      }
      return;
    }

    if (isGoogle) setGooglePrompt((prev) => prev ? { ...prev, checking: true, error: undefined } : null);
    else setUsernameStatus({ checking: true });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await axios.get(`${baseUrl}/api/auth/check-username?username=${encodeURIComponent(clean)}`);
      if (res.data?.available) {
        if (isGoogle) {
          setGooglePrompt((prev) => prev ? { ...prev, checking: false, available: true, error: undefined } : null);
        } else {
          setUsernameStatus({ checking: false, available: true, message: "Username is available!" });
        }
      } else {
        const msg = res.data?.message || "Username is already taken";
        if (isGoogle) {
          setGooglePrompt((prev) => prev ? { ...prev, checking: false, available: false, error: msg } : null);
        } else {
          setUsernameStatus({ checking: false, available: false, message: msg });
        }
      }
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err) ? err.response?.data?.message || "Error checking username" : "Error checking username";
      if (isGoogle) {
        setGooglePrompt((prev) => prev ? { ...prev, checking: false, available: false, error: errorMsg } : null);
      } else {
        setUsernameStatus({ checking: false, available: false, message: errorMsg });
      }
    }
  }, []);

  // Debounced check on signup username input
  useEffect(() => {
    if (type !== "signup" || !formData.username) return;
    const timer = setTimeout(() => {
      checkUsernameAvailability(formData.username, false);
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.username, type, checkUsernameAvailability]);

  // Debounced check on Google username input
  useEffect(() => {
    if (!googlePrompt?.username) return;
    const timer = setTimeout(() => {
      checkUsernameAvailability(googlePrompt.username, true);
    }, 400);
    return () => clearTimeout(timer);
  }, [googlePrompt?.username, checkUsernameAvailability]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "username" && type === "signup") {
      // Auto-lowercase and strip spaces for username
      setFormData((prev) => ({
        ...prev,
        username: value.toLowerCase().replace(/\s+/g, ""),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (type === "signup") {
      const cleanUsername = formData.username.toLowerCase().trim();
      if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
        setError("Username must be 3-30 characters long and contain only lowercase letters, numbers, and underscores.");
        return;
      }
      if (usernameStatus.available === false) {
        setError(usernameStatus.message || "Please choose a different username.");
        return;
      }
    }

    setLoading(true);
    try {
      const url =
        type === "login"
          ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/login`
          : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/signup`;

      const payload = type === "signup"
        ? {
            username: formData.username.toLowerCase().trim(),
            name: formData.name.trim() || formData.username.toLowerCase().trim(),
            email: formData.email.toLowerCase().trim(),
            password: formData.password,
          }
        : {
            username: formData.username.trim(), // Can be username or email
            password: formData.password,
          };

      const response = await axios.post(url, payload);

      if (type === "login") {
        const token = response.data.token;
        const returnedUserId = response.data.userId;
        if (token && returnedUserId) {
          login(token, returnedUserId);
          setVarUserId(returnedUserId);
          localStorage.setItem("chatAppUserId", returnedUserId);
          if (response.data.user) {
            localStorage.setItem("chatAppUser", JSON.stringify(response.data.user));
          }
        }
        setMessage(response.data.message || "Login successful!");
        setError(null);
      }

      if (type === "signup") {
        const token = response.data.token;
        const returnedUserId = response.data.userId;
        if (token && returnedUserId) {
          login(token, returnedUserId);
          setVarUserId(returnedUserId);
          localStorage.setItem("chatAppUserId", returnedUserId);
          if (response.data.user) {
            localStorage.setItem("chatAppUser", JSON.stringify(response.data.user));
          }
        }
        setMessage(response.data.message || "Signup successful!");
        setError(null);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Something went wrong"
        );
      } else {
        setError("Something went wrong");
      }
      setMessage(null);
    } finally {
      setLoading(false);
    }
  };

  interface GoogleCredentialResponse {
    credential?: string;
  }

  const handleGoogleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();

      // If user is brand new: prompt modal popup to choose a permanent username!
      if (data.requiresUsername) {
        setGooglePrompt({
          open: true,
          googleToken: data.googleToken || credentialResponse.credential,
          email: data.email,
          name: data.name || "User",
          picture: data.picture,
          username: "",
          checking: false,
        });
        return;
      }

      if (res.ok) {
        login(data.token, data.userId);
        setVarUserId(data.userId);
        localStorage.setItem("chatAppToken", data.token);
        if (data.user) {
          localStorage.setItem("chatAppUser", JSON.stringify(data.user));
        }
        setMessage("Google login successful!");
      } else {
        setError(data.message || "Google authentication failed.");
      }
    } catch (err) {
      console.error("Google Login Failed:", err);
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googlePrompt) return;

    const cleanUsername = googlePrompt.username.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      setGooglePrompt((prev) => prev ? { ...prev, error: "Username must be 3-30 letters, numbers, or underscores." } : null);
      return;
    }

    if (googlePrompt.available === false) {
      return;
    }

    setGoogleSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: googlePrompt.googleToken,
          username: cleanUsername,
          name: googlePrompt.name.trim() || cleanUsername,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGooglePrompt(null);
        login(data.token, data.userId);
        setVarUserId(data.userId);
        localStorage.setItem("chatAppToken", data.token);
        if (data.user) {
          localStorage.setItem("chatAppUser", JSON.stringify(data.user));
        }
        setMessage("Google account registered successfully!");
      } else {
        setGooglePrompt((prev) => prev ? { ...prev, error: data.message || "Failed to create account" } : null);
      }
    } catch (err) {
      console.error("Google Registration Failed:", err);
      setGooglePrompt((prev) => prev ? { ...prev, error: "Network error completing Google registration." } : null);
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="flex relative justify-center items-center min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden p-4">
      {/* 🌸 Floating faint emojis */}
      <div className="fixed inset-0 overflow-hidden bg-transparent pointer-events-none z-0">
        {mounted && floatingEmojis.map((e) => (
          <motion.span
            key={e.id}
            initial={{ opacity: 0.05, y: 0 }}
            animate={{
              opacity: [0.08, 0.35, 0.06],
              y: [10, -25, 10],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute select-none pointer-events-none"
            style={{
              top: `${e.y}%`,
              left: `${e.x}%`,
              fontSize: `${e.size}rem`,
              opacity: 0.9,
              filter: "blur(0.5px)",
            }}
          >
            {e.emoji}
          </motion.span>
        ))}
      </div>

      <div className="w-full max-w-md p-6 sm:p-8 bg-[var(--card)] text-[var(--foreground)] shadow-xl rounded-2xl border border-[var(--border)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] glow z-10">
        <h2 className="text-2xl font-bold mb-2 text-center tracking-tight">
          {type === "signup" ? "Create Your Account" : "Welcome Back"}
        </h2>
        <p className="text-xs text-center text-[var(--foreground)]/60 mb-6">
          {type === "signup" ? "Set up your permanent username and profile" : "Log in to continue chatting"}
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2 p-3 text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
            <Check size={16} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name Input (Only on Signup) */}
          {type === "signup" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/70 mb-1.5">
                Display Name
              </label>
              <div className="relative flex items-center">
                <UserIcon size={16} className="absolute left-3 text-[var(--foreground)]/40 pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Saurabh Goyal or Anime Lover"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  maxLength={50}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 transition"
                />
              </div>
              <p className="text-[11px] text-[var(--foreground)]/50 mt-1">
                This is your visible name. You can change this anytime.
              </p>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/70 mb-1.5 flex items-center justify-between">
              <span>{type === "signup" ? "Permanent Username" : "Username or Email"}</span>
              {type === "signup" && (
                <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                  <Lock size={11} /> Permanent
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[var(--foreground)]/40 pointer-events-none font-mono text-sm">
                @
              </span>
              <input
                type="text"
                name="username"
                placeholder={type === "signup" ? "animelover or saurabh_goyal" : "username or email"}
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full pl-8 pr-10 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 transition"
              />
              {type === "signup" && (
                <div className="absolute right-3 flex items-center">
                  {usernameStatus.checking ? (
                    <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
                  ) : usernameStatus.available === true ? (
                    <Check size={16} className="text-emerald-500" />
                  ) : usernameStatus.available === false ? (
                    <AlertCircle size={16} className="text-red-500" />
                  ) : null}
                </div>
              )}
            </div>

            {type === "signup" && (
              <div className="mt-1 flex items-center justify-between text-[11px]">
                {usernameStatus.message ? (
                  <span className={usernameStatus.available ? "text-emerald-500" : "text-red-500"}>
                    {usernameStatus.message}
                  </span>
                ) : (
                  <span className="text-[var(--foreground)]/50">
                    3-30 chars, lowercase letters, numbers & _ only. Cannot be changed.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Email Input (Only on Signup) */}
          {type === "signup" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/70 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 transition"
              />
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/70 mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                type={!seePassword ? "password" : "text"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2.5 pr-11 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 transition"
              />
              <button
                type="button"
                onClick={() => setSeePassword(!seePassword)}
                className="absolute right-2.5 p-1 text-[var(--foreground)]/50 hover:text-[var(--accent)] transition rounded-lg"
              >
                {!seePassword ? <Eye size={18} /> : <EyeClosed size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (type === "signup" && usernameStatus.available === false)}
            className={`w-full mt-2 cursor-pointer bg-[var(--accent)] text-[var(--card-foreground)] py-2.5 rounded-xl font-medium border border-[var(--accent)] hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm ${
              loading || (type === "signup" && usernameStatus.available === false) ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin duration-1000" size={18} />
                <span>{type === "signup" ? "Creating Account..." : "Signing In..."}</span>
              </>
            ) : (
              type === "signup" ? "Create Account" : "Sign In"
            )}
          </button>
        </form>

        {/* Google OAuth Section */}
        <div className="flex flex-col items-center mt-6 space-y-4">
          <div className="relative w-full flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]"></div>
            </div>
            <span className="relative px-3 text-xs uppercase bg-[var(--card)] text-[var(--foreground)]/50">
              or continue with
            </span>
          </div>

          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Authentication Failed")}
              theme="outline"
              size="large"
              shape="pill"
            />
          </GoogleOAuthProvider>
        </div>

        <p className="text-center mt-6 text-sm text-[var(--foreground)]/70">
          {type === "signup" ? (
            <>
              Already have an account?{" "}
              <a href="/pages/login" className="text-[var(--accent)] font-semibold hover:underline">
                Sign in
              </a>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <a href="/pages/signup" className="text-[var(--accent)] font-semibold hover:underline">
                Sign up
              </a>
            </>
          )}
        </p>
      </div>

      {/* 🌟 GOOGLE USERNAME SELECTION MODAL POPUP */}
      {googlePrompt?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Header info */}
            <div className="text-center mb-6">
              {googlePrompt.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={googlePrompt.picture}
                  alt={googlePrompt.name}
                  className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-[var(--accent)] shadow"
                />
              ) : (
                <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-xl font-bold">
                  {googlePrompt.name.charAt(0)}
                </div>
              )}
              <h3 className="text-xl font-bold tracking-tight">Set Your Permanent Username</h3>
              <p className="text-xs text-[var(--foreground)]/60 mt-1 max-w-xs mx-auto">
                Welcome, <span className="font-semibold text-[var(--foreground)]">{googlePrompt.name}</span>! Pick your permanent handle to complete your account.
              </p>
            </div>

            {googlePrompt.error && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                <AlertCircle size={15} className="shrink-0" />
                <span>{googlePrompt.error}</span>
              </div>
            )}

            <form onSubmit={handleGoogleCompleteSignup} className="space-y-4">
              {/* Display Name Preview */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/70 mb-1.5">
                  Display Name
                </label>
                <div className="relative flex items-center">
                  <UserIcon size={16} className="absolute left-3 text-[var(--foreground)]/40 pointer-events-none" />
                  <input
                    type="text"
                    value={googlePrompt.name}
                    onChange={(e) => setGooglePrompt({ ...googlePrompt, name: e.target.value })}
                    required
                    maxLength={50}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                  />
                </div>
                <p className="text-[11px] text-[var(--foreground)]/50 mt-1">
                  Shown in chat headers and friend lists. Editable anytime.
                </p>
              </div>

              {/* Permanent Username Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/70 mb-1.5 flex items-center justify-between">
                  <span>Permanent Username</span>
                  <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                    <Lock size={11} /> Cannot be changed
                  </span>
                </label>
                <div className="relative flex items-center">
                  <AtSign size={16} className="absolute left-3 text-[var(--foreground)]/40 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. animelover or saurabh"
                    value={googlePrompt.username}
                    onChange={(e) =>
                      setGooglePrompt({
                        ...googlePrompt,
                        username: e.target.value.toLowerCase().replace(/\s+/g, ""),
                      })
                    }
                    required
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                  />
                  <div className="absolute right-3 flex items-center">
                    {googlePrompt.checking ? (
                      <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
                    ) : googlePrompt.available === true ? (
                      <Check size={16} className="text-emerald-500" />
                    ) : googlePrompt.available === false ? (
                      <AlertCircle size={16} className="text-red-500" />
                    ) : null}
                  </div>
                </div>

                <div className="mt-1 text-[11px]">
                  {googlePrompt.available === true ? (
                    <span className="text-emerald-500 font-medium">✓ Username is available!</span>
                  ) : (
                    <span className="text-[var(--foreground)]/50">
                      3-30 chars, lowercase letters, numbers & _ only.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGooglePrompt(null)}
                  disabled={googleSubmitting}
                  className="flex-1 py-2.5 text-sm font-medium border border-[var(--border)] rounded-xl hover:bg-[var(--background)] transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={googleSubmitting || !googlePrompt.username || googlePrompt.available === false}
                  className="flex-1 py-2.5 text-sm font-medium bg-[var(--accent)] text-[var(--card-foreground)] rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
                >
                  {googleSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Completing...</span>
                    </>
                  ) : (
                    <span>Complete Setup</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
