"use client";

export function LoadingPage() {
  return (
    <div
      style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 9999, backgroundColor: "var(--background, #0f0f0f)" }}
      className="bg-background"
    >
      {/* Spinner */}
      <div style={{ position: "relative", width: 80, height: 80, marginBottom: 16 }}>
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "3px solid transparent",
            borderTopColor: "#ec4899",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{
          position: "absolute", inset: 8, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#ec4899", color: "#fff",
          fontSize: 22, fontWeight: 900, letterSpacing: "-0.05em",
        }}>
          F
        </div>
      </div>
      <span style={{ color: "#ec4899", fontWeight: 700, fontSize: 18, letterSpacing: "0.1em" }}>
        FUJI
      </span>
    </div>
  );
}
