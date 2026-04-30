"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ExamCardProps {
  testId: number;
  status: "new" | "doing" | "done" | "locked";
  title: string;
  image: string;
  tag: string;
  info: string;
  colorTheme?: string;
  attemptId?: number;
  lockedTitle?: string;
  lockedButtonLabel?: string;
  onLockedClick?: () => void;
}

export default function ExamCard({
  testId,
  status,
  title,
  image,
  tag,
  info,
  attemptId,
  lockedTitle = "Het luot JLPT",
  lockedButtonLabel = "Nang cap ngay",
  onLockedClick,
}: ExamCardProps) {
  const renderBadge = () => {
    switch (status) {
      case "new":
        return (
          <span className="absolute top-3 right-3 rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold text-slate-300 backdrop-blur-sm">
            Chua lam
          </span>
        );
      case "doing":
        return (
          <span className="absolute top-3 right-3 rounded-md border border-blue-500/20 bg-blue-500/20 px-2.5 py-1 text-[10px] font-bold text-blue-400 backdrop-blur-sm">
            Dang lam
          </span>
        );
      case "done":
        return (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[12px]">check</span>
            Da xong
          </span>
        );
      case "locked":
        return (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-md border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-bold text-yellow-300 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[12px]">lock</span>
            Topup
          </span>
        );
    }
  };

  const renderButton = () => {
    if (status === "locked") {
      return (
        <Button
          type="button"
          onClick={onLockedClick}
          className="w-full rounded-lg border border-transparent bg-gradient-to-r from-pink-500 to-fuchsia-500 py-2 text-sm font-bold text-white shadow-lg shadow-pink-500/20 hover:from-pink-600 hover:to-fuchsia-600"
        >
          {lockedButtonLabel}
        </Button>
      );
    }

    let btnClass = "";
    let btnText = "";

    if (status === "new") {
      btnClass = "bg-pink-500 hover:bg-pink-600 text-white shadow-pink-500/20";
      btnText = "Bat dau lam bai";
    } else if (status === "doing") {
      btnClass =
        "border-slate-600 bg-slate-700 text-white hover:border-blue-500 hover:bg-blue-600";
      btnText = "Tiep tuc";
    } else if (status === "done") {
      btnClass =
        "border-slate-600 bg-slate-700 text-white hover:border-blue-500 hover:bg-blue-600";
      btnText = "Xem ket qua";
    }

    const href =
      status === "done" && attemptId
        ? `/jlpt/result?attemptId=${attemptId}`
        : `/jlpt-test?testId=${testId}`;

    return (
      <Link
        href={href}
        className={`block w-full rounded-lg border border-transparent py-2 text-center text-sm font-bold shadow-lg transition-all ${btnClass}`}
      >
        {btnText}
      </Link>
    );
  };

  return (
    <article
      className={`glass-card group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/60 ${status === "done" ? "border-t-4 border-t-emerald-500" : ""}`}
    >
      {status === "locked" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 opacity-0 backdrop-blur-[3px] transition-opacity group-hover:opacity-100">
          <span className="material-symbols-outlined mb-2 text-4xl text-yellow-400">
            lock
          </span>
          <p className="mb-3 px-4 text-center text-sm font-bold text-white">
            {lockedTitle}
          </p>
          <Button
            type="button"
            onClick={onLockedClick}
            className="rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-yellow-500/20 hover:from-yellow-600 hover:to-orange-600"
          >
            {lockedButtonLabel}
          </Button>
        </div>
      )}

      <div
        className={`relative h-40 overflow-hidden bg-slate-800 ${status === "locked" ? "grayscale group-hover:grayscale-0" : ""}`}
      >
        <img
          alt={title}
          className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
          src={image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] to-transparent" />
        {renderBadge()}
        {status === "doing" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/50">
            <div className="h-full w-[45%] bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700 dark:bg-pink-500/20 dark:text-pink-300">
            {tag}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            • {info}
          </span>
        </div>
        <h3 className="mb-4 line-clamp-2 text-lg font-bold text-slate-800 transition-colors group-hover:text-pink-600 dark:text-white dark:group-hover:text-pink-400">
          {title}
        </h3>
        <div className="mt-auto border-t border-slate-200 pt-4 dark:border-white/5">
          {renderButton()}
        </div>
      </div>
    </article>
  );
}
