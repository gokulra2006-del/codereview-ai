import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export const INTERVIEW_MODES = [
  {
    id: "low",
    label: "Low",
    title: "Practice",
    desc: "AI Review: Yes · AI Chat: Yes",
    longDesc: "Full AI assistance — recommended for learning and practice sessions.",
    color: "#22c55e",
    border: "rgba(34,197,94,0.35)",
    bg: "rgba(34,197,94,0.08)",
    blockReview: false,
    blockChat: false,
  },
  {
    id: "med",
    label: "Med",
    title: "Challenge",
    desc: "AI Review: Yes · AI Chat: No",
    longDesc: "Review allowed but interactive chat is locked to simulate timed challenges.",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.35)",
    bg: "rgba(245,158,11,0.08)",
    blockReview: false,
    blockChat: true,
  },
  {
    id: "strict",
    label: "Strict",
    title: "Real Interview",
    desc: "AI Review: No · AI Chat: No",
    longDesc: "No AI assistance allowed — simulates an authentic technical interview environment.",
    color: "#ef4444",
    border: "rgba(239,68,68,0.35)",
    bg: "rgba(239,68,68,0.08)",
    blockReview: true,
    blockChat: true,
  },
];

export const TIMER_PRESETS = [
  { label: "30 min", seconds: 1800 },
  { label: "45 min", seconds: 2700 },
  { label: "60 min", seconds: 3600 },
  { label: "90 min", seconds: 5400 },
];

export function useInterviewTimer() {
  const [timerMode, setTimerMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1800);
  const [timerLeft, setTimerLeft] = useState(1800);
  const [timerRunning, setTimerRunning] = useState(false);
  const [interviewMode, setInterviewMode] = useState("low");
  const [showTimerSetup, setShowTimerSetup] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const timerRef = useRef(null);

  const activeModeConfig =
    INTERVIEW_MODES.find((m) => m.id === interviewMode) || INTERVIEW_MODES[0];

  const startTimer = (seconds, mode) => {
    const s = seconds || timerSeconds;
    const m = mode || interviewMode;
    setTimerSeconds(s);
    setTimerLeft(s);
    setInterviewMode(m);
    setTimerMode(true);
    setTimerRunning(true);
    setShowTimerSetup(false);
    toast.success(`Interview timer started: ${Math.floor(s / 60)} minutes (${m.toUpperCase()} mode)`);
  };

  const togglePause = () => {
    setTimerRunning((prev) => {
      const next = !prev;
      toast(next ? "Interview resumed" : "Interview paused", { icon: next ? "▶️" : "⏸️" });
      return next;
    });
  };

  const cancelTimer = useCallback(() => {
    setTimerMode(false);
    setTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setShowCancelConfirm(false);
    toast("Interview timer cancelled.", { icon: "⏹️" });
  }, []);

  useEffect(() => {
    if (timerRunning && timerLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimerLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            toast.error("Time is up! Interview completed.", { duration: 6000 });
            return 0;
          }
          if (prev === 300) {
            toast("5 minutes remaining!", { icon: "⏰" });
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerLeft]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return {
    timerMode,
    timerSeconds,
    timerLeft,
    timerRunning,
    interviewMode,
    setInterviewMode,
    showTimerSetup,
    setShowTimerSetup,
    showCancelConfirm,
    setShowCancelConfirm,
    activeModeConfig,
    startTimer,
    togglePause,
    cancelTimer,
    formatTimer,
  };
}
