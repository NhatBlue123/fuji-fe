"use client";

import type { CSSProperties, ReactNode } from "react";

type LiquidGlassSafeProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
} & Record<string, unknown>;

export default function LiquidGlassSafe({
  children,
  className,
  style,
}: LiquidGlassSafeProps) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
