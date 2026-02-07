import "@/app/globals.css";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-[#020617] selection:bg-pink-500 selection:text-white">
      {/* ═══ Immersive Background ═══ */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Base */}
        <div className="absolute inset-0 bg-[#020617]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />

        {/* Aurora Ribbons */}
        <div className="absolute -top-[20%] -left-[10%] w-[120%] h-[600px] bg-gradient-to-r from-transparent via-blue-600/30 to-transparent blur-[80px] animate-aurora-flow-1" />
        <div
          className="absolute top-[30%] -right-[20%] w-[140%] h-[500px] bg-gradient-to-r from-transparent via-pink-400/25 to-transparent blur-[90px] animate-aurora-flow-2"
          style={{ animationDelay: "-5s" }}
        />

        {/* Central Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-b from-blue-900/10 via-indigo-900/10 to-transparent rounded-full blur-[100px] animate-pulse-glow" />

        {/* Edge Accents */}
        <div className="absolute bottom-0 left-0 w-full h-[200px] bg-gradient-to-t from-blue-600/5 to-transparent blur-[40px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-pink-400/5 to-transparent blur-[60px] rounded-full" />

        {/* Floating Orbs */}
        <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-blue-400/40 animate-float" />
        <div
          className="absolute top-[25%] right-[15%] w-1.5 h-1.5 rounded-full bg-pink-400/30 animate-float"
          style={{ animationDelay: "-2s", animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[20%] left-[20%] w-1 h-1 rounded-full bg-indigo-400/50 animate-float"
          style={{ animationDelay: "-4s", animationDuration: "7s" }}
        />
        <div
          className="absolute top-[60%] right-[25%] w-2.5 h-2.5 rounded-full bg-blue-300/20 animate-float"
          style={{ animationDelay: "-1s", animationDuration: "9s" }}
        />
        <div
          className="absolute top-[40%] left-[5%] w-1.5 h-1.5 rounded-full bg-violet-400/30 animate-float"
          style={{ animationDelay: "-3s", animationDuration: "10s" }}
        />
        <div
          className="absolute bottom-[35%] right-[8%] w-1 h-1 rounded-full bg-cyan-400/40 animate-float"
          style={{ animationDelay: "-6s", animationDuration: "6s" }}
        />

        {/* Grid Lines Subtle */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* ═══ Top Nav Bar ═══ */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/20 group-hover:shadow-blue-500/40 transition-shadow">
            <span className="material-symbols-outlined text-2xl">
              landscape
            </span>
          </div>
          <span className="text-xl font-black tracking-tight text-white drop-shadow-md group-hover:text-blue-200 transition-colors">
            FUJI
          </span>
        </Link>

        <Link
          href="/"
          className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group"
        >
          <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          Về trang chủ
        </Link>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="relative z-10 flex items-center justify-center px-4 py-4 pb-12">
        {children}
      </main>

      {/* ═══ Bottom Decorative Line ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
    </div>
  );
}
