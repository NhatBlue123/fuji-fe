/**
 * JLPT Text Renderer
 *
 * Parses contentText with underline syntax: __word__
 * Example: "きのう __3時間以上__ へんきょうしました"
 * Renders "3時間以上" with text-decoration: underline
 */

import React from "react";

/**
 * Renders JLPT question text with underline support.
 * Syntax: __text__ → <span style="text-decoration: underline">text</span>
 */
export function renderJlptText(
  text: string,
  className?: string
): React.ReactNode {
  if (!text) return null;

  // Split on __...__ pattern
  const parts = text.split(/(__[^_]+__)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("__") && part.endsWith("__")) {
          const inner = part.slice(2, -2);
          return (
            <span
              key={i}
              style={{ textDecoration: "underline" }}
              className="font-medium"
            >
              {inner}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

/**
 * Strip underline markers — used to get plain text for display/storage checks
 */
export function stripUnderlineMarkers(text: string): string {
  return text.replace(/__([^_]+)__/g, "$1");
}
