"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getApiUrl } from "../utils/apiUrl";
import { apiFetch } from "../utils/apiFetch";
import { getSocket } from "./useSocket";
import {
  PairGamificationState,
  GamificationResultPayload,
} from "../states/togetherTypes";

export function useGamification(partnerId?: string | null) {
  const [gamificationState, setGamificationState] = useState<PairGamificationState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<GamificationResultPayload | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const partnerIdRef = useRef(partnerId);
  partnerIdRef.current = partnerId;

  const fetchPairState = useCallback(async (targetPartnerId?: string | null) => {
    const pId = targetPartnerId || partnerIdRef.current;
    if (!pId) return;

    try {
      setLoading(true);
      const res = await apiFetch(`${getApiUrl()}/api/gamification/pair/${pId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setGamificationState(json.data);
        }
      }
    } catch (err) {
      console.error("[useGamification] Failed to fetch pair gamification:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when partnerId changes
  useEffect(() => {
    if (partnerId) {
      fetchPairState(partnerId);
    } else {
      setGamificationState(null);
    }
  }, [partnerId, fetchPairState]);

  // Socket listener for real-time match completions & unlocks
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleGamificationResult = (result: GamificationResultPayload) => {
      console.log("[useGamification] Received result:", result);
      setLastResult(result);
      setShowResultModal(true);
      if (partnerIdRef.current) {
        fetchPairState(partnerIdRef.current);
      }
    };

    socket.on("together:gamification:result", handleGamificationResult);

    return () => {
      socket.off("together:gamification:result", handleGamificationResult);
    };
  }, [fetchPairState]);

  const isGameUnlocked = useCallback(
    (gameId: string): boolean => {
      if (!gamificationState || !Array.isArray(gamificationState.games)) return true;
      const found = gamificationState.games.find((g) => g.gameId === gameId);
      return found ? found.isUnlocked : true;
    },
    [gamificationState]
  );

  const getGameLevel = useCallback(
    (gameId: string): number => {
      if (!gamificationState || !Array.isArray(gamificationState.games)) return 1;
      const found = gamificationState.games.find((g) => g.gameId === gameId);
      return found?.currentLevel || 1;
    },
    [gamificationState]
  );

  const dismissResultModal = useCallback(() => {
    setShowResultModal(false);
  }, []);

  return {
    gamificationState,
    loading,
    lastResult,
    showResultModal,
    isGameUnlocked,
    getGameLevel,
    dismissResultModal,
    refetch: () => fetchPairState(partnerId),
  };
}
