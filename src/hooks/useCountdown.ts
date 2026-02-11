import { useEffect, useRef, useState } from "react";

interface UseCountdownProps {
  duration: number; // giây
  onTimeUp: () => void;
  onFiveMinutesLeft?: () => void;
}

export function useCountdown({
  duration,
  onTimeUp,
  onFiveMinutesLeft,
}: UseCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warnedRef = useRef(false);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onTimeUp();
          return 0;
        }

        if (prev === 300 && !warnedRef.current) {
          warnedRef.current = true;
          onFiveMinutesLeft?.();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, []);

  return { timeLeft };
}
