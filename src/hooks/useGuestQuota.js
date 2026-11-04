import { useState, useEffect, useCallback } from "react";
import { getQuota } from "../services/api";

export function useGuestQuota(isAuthenticated) {
  const [quota, setQuota] = useState({
    plan: "guest",
    isGuest: !isAuthenticated,
    reviews: { used: 0, limit: 5, remaining: 5 },
    runs: { used: 0, limit: 10, remaining: 10 },
  });
  const [loading, setLoading] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitType, setLimitType] = useState("review"); // 'review' | 'run'

  const refreshQuota = useCallback(async () => {
    try {
      const data = await getQuota();
      if (data?.quota) {
        setQuota(data.quota);
      }
    } catch (err) {
      console.warn("Failed to fetch quota from server:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshQuota();
  }, [refreshQuota, isAuthenticated]);

  const checkQuota = (type) => {
    if (quota.plan === "pro") return true;

    const remaining = type === "review" ? quota.reviews.remaining : quota.runs.remaining;
    if (remaining !== "unlimited" && remaining <= 0) {
      setLimitType(type);
      setShowLimitModal(true);
      return false;
    }
    return true;
  };

  const triggerLimitModal = (type) => {
    setLimitType(type);
    setShowLimitModal(true);
  };

  return {
    quota,
    loading,
    refreshQuota,
    checkQuota,
    showLimitModal,
    setShowLimitModal,
    limitType,
    triggerLimitModal,
  };
}
