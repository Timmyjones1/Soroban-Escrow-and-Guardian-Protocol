"use client";

import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface CountdownTimerProps {
  targetTimestamp: number; // Unix seconds
  label: string;
  onExpire?: () => void;
  expiredLabel?: string;
  urgencyThresholdHours?: number;
}

export function CountdownTimer({
  targetTimestamp,
  label,
  onExpire,
  expiredLabel = "Window Elapsed",
  urgencyThresholdHours = 24,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    totalSeconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalSeconds: 0,
  });

  useEffect(() => {
    const calculate = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = targetTimestamp - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          totalSeconds: 0,
        });
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        totalSeconds: diff,
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-semibold">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>{expiredLabel}</span>
      </div>
    );
  }

  const isUrgent = timeLeft.totalSeconds < urgencyThresholdHours * 3600;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${
        isUrgent
          ? "bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse"
          : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>
        {label}: {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
        {String(timeLeft.hours).padStart(2, "0")}h:
        {String(timeLeft.minutes).padStart(2, "0")}m:
        {String(timeLeft.seconds).padStart(2, "0")}s
      </span>
    </div>
  );
}

