import { useEffect, useRef, useState } from "react";

interface UseCountdownProps {
  duration: number; // giây
  paused?: boolean; // nếu true, timer dừng
  onTimeUp: () => void;
  onFiveMinutesLeft?: () => void;
  initialTimeLeft?: number; // thời gian còn lại ban đầu (dùng khi restore từ localStorage)
}

export function useCountdown({
  duration,
  paused = false,
  onTimeUp,
  onFiveMinutesLeft,
  initialTimeLeft,
}: UseCountdownProps) {
  // Only initialize with initialTimeLeft when it is actually a valid number (not undefined)
  const [timeLeft, setTimeLeft] = useState(
    initialTimeLeft !== undefined ? initialTimeLeft : duration
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warnedRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  const onFiveMinutesLeftRef = useRef(onFiveMinutesLeft);
  // Track if we've already started the countdown to avoid restarting on re-renders
  const hasStartedRef = useRef(false);

  // Keep callbacks up to date without restarting interval
  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);
  useEffect(() => { onFiveMinutesLeftRef.current = onFiveMinutesLeft; }, [onFiveMinutesLeft]);

  // Handle when initialTimeLeft changes after mount (e.g., restored from localStorage on reload)
  useEffect(() => {
    if (initialTimeLeft !== undefined) {
      // Clear existing interval before resetting
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      warnedRef.current = false;
      hasStartedRef.current = false;
      setTimeLeft(initialTimeLeft);
    }
  }, [initialTimeLeft]);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Don't restart if already running
    if (hasStartedRef.current && intervalRef.current) return;
    hasStartedRef.current = true;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          hasStartedRef.current = false;
          onTimeUpRef.current();
          return 0;
        }
        if (prev === 300 && !warnedRef.current) {
          warnedRef.current = true;
          onFiveMinutesLeftRef.current?.();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      hasStartedRef.current = false;
    };
  }, [paused]);

  return { timeLeft };
}
