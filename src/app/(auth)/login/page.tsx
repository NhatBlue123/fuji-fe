"use client";

import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="h-screen w-full overflow-hidden flex items-center justify-center relative bg-background-dark">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#020617]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[120%] h-[600px] bg-gradient-to-r from-transparent via-blue-600/30 to-transparent blur-[80px] animate-aurora-flow-1"></div>
        <div
          className="absolute top-[30%] -right-[20%] w-[140%] h-[500px] bg-gradient-to-r from-transparent via-pink-400/25 to-transparent blur-[90px] animate-aurora-flow-2"
          style={{ animationDelay: "-5s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-b from-blue-900/10 via-indigo-900/10 to-transparent rounded-full blur-[100px] animate-pulse-glow"></div>
        <div className="absolute bottom-0 left-0 w-full h-[200px] bg-gradient-to-t from-blue-600/5 to-transparent blur-[40px]"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-pink-400/5 to-transparent blur-[60px] rounded-full"></div>
      </div>

      <LoginForm />
    </div>
  );
}
