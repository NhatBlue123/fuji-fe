"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * AiAvatar - Cute AI avatar with blinking animation
 * Inspired by friendly ghost/blob character
 */

export default function AiAvatar({ className = "" }: { className?: string }) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    // Random blink every 3-5 seconds
    const scheduleNextBlink = () => {
      const delay = 3000 + Math.random() * 2000;
      setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 150); // Blink duration
      }, delay);
    };

    scheduleNextBlink();
  }, []);

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Glow effect */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="bodyGradient" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0f0f0" />
        </radialGradient>
      </defs>

      {/* Body - Cute blob shape */}
      <motion.circle
        cx="50"
        cy="50"
        r="40"
        fill="url(#bodyGradient)"
        filter="url(#glow)"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Left Eye */}
      <motion.ellipse
        cx="38"
        cy="45"
        rx="4"
        ry={isBlinking ? "0.5" : "8"}
        fill="#2d3748"
        animate={{
          ry: isBlinking ? 0.5 : 8,
        }}
        transition={{
          duration: 0.1,
        }}
      />

      {/* Right Eye */}
      <motion.ellipse
        cx="62"
        cy="45"
        rx="4"
        ry={isBlinking ? "0.5" : "8"}
        fill="#2d3748"
        animate={{
          ry: isBlinking ? 0.5 : 8,
        }}
        transition={{
          duration: 0.1,
        }}
      />

      {/* Eye shine - Left */}
      {!isBlinking && (
        <motion.circle
          cx="40"
          cy="42"
          r="2"
          fill="#ffffff"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Eye shine - Right */}
      {!isBlinking && (
        <motion.circle
          cx="64"
          cy="42"
          r="2"
          fill="#ffffff"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Smile - Optional cute mouth */}
      <motion.path
        d="M 40 60 Q 50 65 60 60"
        stroke="#2d3748"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        animate={{
          d: [
            "M 40 60 Q 50 65 60 60",
            "M 40 60 Q 50 67 60 60",
            "M 40 60 Q 50 65 60 60",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </svg>
  );
}
