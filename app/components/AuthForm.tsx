/* eslint "@typescript-eslint/no-explicit-any": "error" */
'use client';
import { useAuth } from "../context/AuthContext";
import axios, { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import {disconnectSocket} from "../hooks/useSocket";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { floatingEmojisAtom } from "../states/States";
import { Eye, EyeClosed } from "lucide-react";

interface AuthFormProps {
  type: "signup" | "login";
}

const backendUrl = process.env.NEXT_PUBLIC_API_URL;

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    password: string;
  }>({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [varUserId, setVarUserId] = useState<string | null>(null)
  const {login} = useAuth(); 
  const [floatingEmojis] = useAtom(floatingEmojisAtom);
  const handleChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
    setFormData({
        ...formData, [e.target.name]:e.target.value
    })
  }
  const [seePassword, setSeePassword] = useState(false);
useEffect(() => {
    const savedTheme = localStorage.getItem("chatTheme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);
  
  useEffect(()=>{
    if(varUserId){
      // const socket = useSocket(varUserId)
      console.log("🔗 Socket connected for user:");
      // console.log("🔗 Socket connected for user:", varUserId);

      return () => {
        disconnectSocket();
        console.log("🔌 Socket disconnected");
      };
    }
  }, [varUserId]);


  const handleSubmit = async (e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault()

    try {

        const url = type === "login"? `${backendUrl}/api/auth/login`:`${backendUrl}/api/auth/signup`

        const response = await axios.post(url, formData)
        const token = response.data.token;
        const returnedUserId = response.data.userId;
        if (token && returnedUserId){
            login(token)
            setVarUserId(returnedUserId)
            localStorage.setItem("userId", returnedUserId)
        }
        setMessage(response.data.message || "success")
        setError(null)
        
    } catch (err)
     {
      const error = err as AxiosError<{ error: string }>; // <- typed
        setError(error.response?.data?.error || 'Something went wrong')
        setMessage(null)
    }
  }


  return (
    <div className="flex relative justify-center items-center min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      {/* 🌸 Floating faint emojis */}
            <div className="fixed inset-0 overflow-hidden bg-transparent pointer-events-none z-0">
              {floatingEmojis.map((e) => (
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
      <div className="w-lg p-6 bg-[var(--card)] text-[var(--foreground) shadow-md rounded transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] glow">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {type === "signup" ? "Sign Up" : "Login"}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {message && <p className="text-green-500 mb-4">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "signup" && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-[var(--accent)]"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-[var(--accent)]"
          />

<div className="flex items-center gap-2 w-full">
          <input
            type={`${!seePassword ? "password" : "text"}`}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-[var(--accent)]"
          />
          <span className="flex justify-center items-center p-2 cursor-pointer border hover:border-[var(--accent)] rounded">
          {!seePassword ? (
            <Eye
              onClick={() => setSeePassword(!seePassword)}
              size={23}
              className="text-[var(--accent)]"
            />
          ) : (
            <EyeClosed
              onClick={() => setSeePassword(!seePassword)}
              size={23}
              className="text-[var(--accent)]"
            />
          )}
        </span>

          </div>

          <button
            type="submit"
            className="w-full cursor-pointer bg-[var(--accent)] text-[var(--card-foreground)] py-2 rounded hover:bg-[var(--accent)]/15 border border-[var(--foreground)] hover:border-[var(--accent)] transition"
          >
            {type === "signup" ? "Sign Up" : "Login"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          {type === "signup" ? (
            <a href="/pages/login" className="text-blue-500 hover:underline">
              Already have an account? Login
            </a>
          ) : (
            <a href="/pages/signup" className="text-blue-500 hover:underline">
              Don`&apos;`t have an account? Sign Up
            </a>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
