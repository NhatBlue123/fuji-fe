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
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft ?? duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warnedRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  const onFiveMinutesLeftRef = useRef(onFiveMinutesLeft);

  // Keep callbacks up to date without restarting interval
  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);
  useEffect(() => { onFiveMinutesLeftRef.current = onFiveMinutesLeft; }, [onFiveMinutesLeft]);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
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

    return () => clearInterval(intervalRef.current!);
  }, [paused]);

  return { timeLeft };
}
