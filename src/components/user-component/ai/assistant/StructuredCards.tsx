"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import LiquidGlass from "@/components/ui/liquid-glass-safe";
import type {
  ActionLinkItem,
  CourseComparePayload,
  CoursePreviewItem,
  NextStepsPayload,
  PaymentActionPayload,
  QuickFactItem,
  StructuredBlockType,
} from "./types";

const glassCardProps = {
  displacementScale: 74,
  blurAmount: 0.075,
  saturation: 154,
  elasticity: 0.16,
  mode: "prominent" as const,
};

const ABSOLUTE_URL_RE = /^https?:\/\//i;
const PROTOCOL_RELATIVE_RE = /^\/\//;

const COURSE_MEDIA_ORIGIN = (() => {
  const raw = String(process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (!raw) {
    return "";
  }
  try {
    const parsed = new URL(raw);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
})();

type SkillTone = "primary" | "sky" | "emerald" | "amber" | "rose" | "slate";

function resolveToneClasses(input?: string) {
  const tone =
    input === "sky" ||
    input === "emerald" ||
    input === "amber" ||
    input === "rose" ||
    input === "slate"
      ? input
      : "primary";

  const map: Record<SkillTone, { card: string; chip: string; icon: string }> = {
    primary: {
      card: "from-primary/16 via-blue-500/10 to-indigo-500/12 border-primary/18",
      chip: "bg-primary/14 text-primary",
      icon: "bg-primary/18 text-primary",
    },
    sky: {
      card: "from-sky-500/16 via-cyan-500/10 to-blue-500/12 border-sky-500/18",
      chip: "bg-sky-500/14 text-sky-700 dark:text-sky-300",
      icon: "bg-sky-500/18 text-sky-700 dark:text-sky-300",
    },
    emerald: {
      card: "from-emerald-500/16 via-teal-500/10 to-green-500/12 border-emerald-500/18",
      chip: "bg-emerald-500/14 text-emerald-700 dark:text-emerald-300",
      icon: "bg-emerald-500/18 text-emerald-700 dark:text-emerald-300",
    },
    amber: {
      card: "from-amber-500/16 via-yellow-500/10 to-orange-500/12 border-amber-500/18",
      chip: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
      icon: "bg-amber-500/18 text-amber-700 dark:text-amber-300",
    },
    rose: {
      card: "from-rose-500/16 via-pink-500/10 to-fuchsia-500/12 border-rose-500/18",
      chip: "bg-rose-500/14 text-rose-700 dark:text-rose-300",
      icon: "bg-rose-500/18 text-rose-700 dark:text-rose-300",
    },
    slate: {
      card: "from-slate-500/16 via-slate-400/10 to-slate-600/12 border-slate-500/18",
      chip: "bg-slate-500/14 text-slate-700 dark:text-slate-300",
      icon: "bg-slate-500/18 text-slate-700 dark:text-slate-300",
    },
  };

  return map[tone];
}

function SkillIcon({
  name,
  fallback = "arrow_forward",
  className,
}: {
  name?: string;
  fallback?: string;
  className?: string;
}) {
  const iconName = String(name || "").trim() || fallback;
  return (
    <span className={`material-symbols-outlined ${className || ""}`}>
      {iconName}
    </span>
  );
}

function normalizeThumbnailSrc(raw?: string) {
  const value = String(raw || "").trim();
  if (!value) {
    return "";
  }
  if (ABSOLUTE_URL_RE.test(value) || value.startsWith("data:image/")) {
    return value;
  }
  if (PROTOCOL_RELATIVE_RE.test(value)) {
    return `https:${value}`;
  }

  const normalized = value.replace(/\\/g, "/").replace(/^\.\//, "/");
  if (normalized.startsWith("/")) {
    if (COURSE_MEDIA_ORIGIN) {
      return `${COURSE_MEDIA_ORIGIN}${normalized}`;
    }
    return normalized;
  }

  if (COURSE_MEDIA_ORIGIN) {
    return `${COURSE_MEDIA_ORIGIN}/${normalized}`;
  }

  return `/${normalized}`;
}

function ThumbnailFallback({ title }: { title: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200/70 via-slate-100/60 to-sky-100/60 px-2 text-slate-600 dark:from-slate-700/55 dark:via-slate-800/45 dark:to-slate-700/55 dark:text-slate-200">
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.5),transparent_58%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.12),transparent_58%)]" />
      <div className="relative flex max-w-full flex-col items-center gap-1.5 text-center">
        <span className="material-symbols-outlined text-base opacity-70">
          image
        </span>
        <span className="line-clamp-2 text-[10px] font-medium leading-4 opacity-90">
          {title}
        </span>
      </div>
    </div>
  );
}

function CourseThumbnail({
  src,
  title,
  className,
}: {
  src?: string;
  title: string;
  className: string;
}) {
  const normalized = useMemo(() => normalizeThumbnailSrc(src), [src]);
  const [resolvedSrc, setResolvedSrc] = useState(normalized);

  useEffect(() => {
    setResolvedSrc(normalized);
  }, [normalized]);

  if (!resolvedSrc) {
    return <ThumbnailFallback title={title} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={title}
      className={className}
      loading="lazy"
      onError={() => setResolvedSrc("")}
    />
  );
}

export function CoursePreviewList({ items }: { items: CoursePreviewItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="my-3 grid gap-3">
      {items.map((item, idx) => (
        <LiquidGlass
          key={item.id}
          {...glassCardProps}
          cornerRadius={18}
          className="rounded-2xl"
        >
          <Link
            href={item.url}
            className="group relative block overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/82 via-white/54 to-sky-100/45 p-3 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_24px_52px_-26px_rgba(59,130,246,0.45)] dark:border-white/15 dark:from-slate-900/72 dark:via-slate-900/56 dark:to-slate-800/45"
            style={{
              animation:
                "glassRise 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
              animationDelay: `${idx * 55}ms`,
            }}
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.7),transparent_55%)]" />
            <span className="pointer-events-none absolute -left-8 top-0 h-12 w-56 -translate-y-1/2 rotate-[8deg] bg-gradient-to-r from-transparent via-white/65 to-transparent blur-xl transition-transform duration-700 group-hover:translate-y-8" />

            <div className="relative flex gap-3 rounded-[14px] bg-white/74 p-3 backdrop-blur-xl dark:bg-slate-900/55">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-white/55 bg-white/55 shadow-inner dark:border-white/10 dark:bg-slate-800/50">
                <CourseThumbnail
                  src={item.thumbnail}
                  title={item.title}
                  className="h-full w-full object-cover saturate-110"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </p>
                {item.price && (
                  <p className="mt-1 text-xs font-semibold text-primary/95">
                    {item.price}
                  </p>
                )}
                {item.meta && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground/90">
                    {item.meta}
                  </p>
                )}
                {item.enrolled && (
                  <span className="mt-2 inline-flex items-center rounded-full border border-emerald-400/45 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Đã đăng ký
                  </span>
                )}
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary/95">
                  Xem chi tiết khóa học
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                    →
                  </span>
                </p>
              </div>
            </div>
          </Link>
        </LiquidGlass>
      ))}

      <style jsx>{`
        @keyframes glassRise {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export function CourseCompareTable({
  payload,
}: {
  payload: CourseComparePayload;
}) {
  if (payload.columns.length === 0 || payload.rows.length === 0) {
    return null;
  }

  return (
    <LiquidGlass
      {...glassCardProps}
      cornerRadius={18}
      className="my-4 rounded-2xl"
    >
      <div className="overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/82 via-white/56 to-sky-100/45 dark:border-white/15 dark:from-slate-900/72 dark:via-slate-900/56 dark:to-slate-800/45">
        {payload.title && (
          <div className="border-b border-white/45 bg-white/45 px-3 py-2 text-sm font-semibold text-foreground backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            {payload.title}
          </div>
        )}

        <div className="compare-scroll overflow-x-auto px-1 pb-2">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="bg-white/45 dark:bg-white/5">
                <th className="w-40 border-b border-r border-white/40 px-3 py-2 text-left text-xs font-semibold text-muted-foreground dark:border-white/10">
                  Thuộc tính
                </th>
                {payload.columns.map((column) => (
                  <th
                    key={column.id}
                    className="min-w-[220px] border-b border-white/40 px-3 py-3 align-top dark:border-white/10"
                  >
                    <Link
                      href={column.url}
                      className="group block overflow-hidden rounded-lg border border-white/50 bg-white/55 transition-all hover:border-primary/40 dark:border-white/10 dark:bg-slate-900/45"
                    >
                      <div className="h-28 w-full overflow-hidden bg-muted/60">
                        <CourseThumbnail
                          src={column.thumbnail}
                          title={column.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-left">
                        <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                          {column.title}
                        </p>
                        {column.price && (
                          <p className="mt-1 text-xs font-semibold text-primary">
                            {column.price}
                          </p>
                        )}
                      </div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payload.rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-white/35 last:border-b-0 dark:border-white/10"
                >
                  <td className="border-r border-white/35 bg-white/35 px-3 py-2 text-xs font-semibold text-foreground dark:border-white/10 dark:bg-white/5">
                    {row.label}
                  </td>
                  {row.values.map((value, idx) => (
                    <td
                      key={`${row.label}-${idx}`}
                      className="px-3 py-2 text-center text-sm text-foreground"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .compare-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(100, 116, 139, 0.52) transparent;
        }

        .compare-scroll::-webkit-scrollbar {
          height: 7px;
        }

        .compare-scroll::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 999px;
        }

        .compare-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(
            90deg,
            rgba(148, 163, 184, 0.5),
            rgba(100, 116, 139, 0.58)
          );
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.24);
        }

        .compare-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            90deg,
            rgba(100, 116, 139, 0.65),
            rgba(71, 85, 105, 0.72)
          );
        }
      `}</style>
    </LiquidGlass>
  );
}

export function QuickFactsCard({ facts }: { facts: QuickFactItem[] }) {
  if (facts.length === 0) {
    return null;
  }

  return (
    <LiquidGlass
      {...glassCardProps}
      cornerRadius={18}
      className="my-3 rounded-2xl"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/84 via-sky-50/52 to-blue-100/38 p-3.5 shadow-[0_22px_48px_-34px_rgba(15,23,42,0.4)] dark:border-white/15 dark:from-slate-900/72 dark:via-slate-900/58 dark:to-slate-800/45">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.62),transparent_54%)]" />

        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
            Insight Nhanh
          </p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((fact, idx) => {
              const tone = resolveToneClasses(fact.tone);
              return (
                <div
                  key={`${fact.label}-${idx}`}
                  className={`rounded-xl border bg-gradient-to-br px-3 py-2.5 ${tone.card}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
                    >
                      <SkillIcon
                        name={fact.icon}
                        fallback="insights"
                        className="text-[15px]"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {fact.label}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {fact.value}
                      </p>
                      {fact.note && (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                          {fact.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </LiquidGlass>
  );
}

export function NextStepsCard({ payload }: { payload: NextStepsPayload }) {
  const steps = payload.steps || [];
  if (steps.length === 0) {
    return null;
  }

  return (
    <LiquidGlass
      {...glassCardProps}
      cornerRadius={18}
      className="my-3 rounded-2xl"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/86 via-white/58 to-emerald-100/28 p-3.5 shadow-[0_20px_42px_-30px_rgba(16,185,129,0.28)] dark:border-white/15 dark:from-slate-900/72 dark:via-slate-900/58 dark:to-slate-800/45">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.66),transparent_54%)]" />
        <div className="relative z-10">
          <p className="text-sm font-semibold text-foreground">
            {payload.title || "Các bước đề xuất"}
          </p>

          <div className="mt-2.5 space-y-2">
            {steps.map((step, idx) => (
              <Link
                key={`${step.url}-${idx}`}
                href={step.url}
                className="group flex items-start gap-3 rounded-xl border border-white/60 bg-white/72 px-3 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40 hover:shadow-[0_16px_24px_-18px_rgba(16,185,129,0.55)] dark:border-white/15 dark:bg-slate-900/55"
              >
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-400/35 bg-emerald-500/14 text-emerald-700 dark:text-emerald-300">
                  <SkillIcon
                    name={step.icon}
                    fallback="check_circle"
                    className="text-[16px]"
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    {idx + 1}. {step.label}
                  </p>
                  {step.note && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {step.note}
                    </p>
                  )}
                </div>

                <span className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-foreground/80 dark:border-white/15 dark:bg-slate-800/70 dark:text-slate-200">
                  Mở
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </LiquidGlass>
  );
}

export function StructuredLoadingCard({
  blockType,
}: {
  blockType: StructuredBlockType;
}) {
  const label =
    blockType === "course-preview"
      ? "Đang chuẩn bị danh sách khóa học..."
      : blockType === "course-compare"
        ? "Đang chuẩn bị bảng so sánh khóa học..."
        : blockType === "payment-action"
          ? "Đang chuẩn bị nút thanh toán..."
          : blockType === "quick-facts"
            ? "Đang chuẩn bị cụm insight..."
            : blockType === "next-steps"
              ? "Đang chuẩn bị các bước đề xuất..."
              : "Đang chuẩn bị các nút điều hướng...";

  return (
    <LiquidGlass
      displacementScale={66}
      blurAmount={0.065}
      saturation={146}
      elasticity={0.12}
      mode="standard"
      cornerRadius={12}
      className="my-3 inline-flex rounded-lg"
    >
      <div className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/62 px-3 py-2 text-xs text-muted-foreground dark:border-white/15 dark:bg-slate-900/55">
        <Loader2 className="size-3 animate-spin" />
        {label}
      </div>
    </LiquidGlass>
  );
}

export function PaymentActionCard({
  payload,
}: {
  payload: PaymentActionPayload;
}) {
  return (
    <LiquidGlass
      {...glassCardProps}
      cornerRadius={18}
      className="my-3 rounded-2xl"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/85 via-primary/10 to-sky-100/45 p-3.5 shadow-[0_18px_42px_-30px_rgba(37,99,235,0.45)] dark:border-white/15 dark:from-slate-900/70 dark:via-slate-900/58 dark:to-slate-800/45">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(191,219,254,0.45),transparent_52%)]" />
        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {payload.label}
            </p>
            {payload.note && (
              <p className="mt-1 text-xs text-muted-foreground">
                {payload.note}
              </p>
            )}
          </div>
          <Link
            href={payload.url}
            className="inline-flex items-center justify-center rounded-xl border border-white/60 bg-gradient-to-r from-primary to-blue-500 px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-[0_14px_28px_-20px_rgba(37,99,235,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
          >
            Đi đến thanh toán
          </Link>
        </div>
      </div>
    </LiquidGlass>
  );
}

export function ActionLinksCard({ links }: { links: ActionLinkItem[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <LiquidGlass
      {...glassCardProps}
      cornerRadius={22}
      className="my-4 rounded-[1.35rem]"
    >
      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/60 bg-gradient-to-br from-white/85 via-sky-50/58 to-blue-100/36 p-4 shadow-[0_24px_56px_-34px_rgba(37,99,235,0.45)] dark:border-white/15 dark:from-slate-900/72 dark:via-slate-900/58 dark:to-slate-800/45">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_8%,rgba(147,197,253,0.45),transparent_52%)]" />
        <span className="pointer-events-none absolute -left-12 top-0 h-16 w-72 -translate-y-1/2 rotate-[6deg] bg-gradient-to-r from-transparent via-white/70 to-transparent blur-xl" />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
            Fuji Smart Links
          </p>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/55 bg-white/65 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground dark:border-white/15 dark:bg-slate-900/52">
            {links.length} gợi ý
          </span>
        </div>

        <div className="relative z-10 mt-3 grid gap-2.5 sm:grid-cols-2">
          {links.map((item, idx) => {
            const tone = resolveToneClasses(item.tone);
            return (
              <LiquidGlass
                key={`${item.url}-${idx}`}
                displacementScale={70}
                blurAmount={0.07}
                saturation={150}
                elasticity={0.13}
                mode="standard"
                cornerRadius={14}
                className="rounded-xl"
              >
                <Link
                  href={item.url}
                  className={`group relative block overflow-hidden rounded-xl border bg-gradient-to-br px-3.5 py-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-20px_rgba(37,99,235,0.5)] dark:border-white/15 dark:bg-slate-900/55 ${tone.card}`}
                  style={{
                    animation:
                      "glassRise 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
                    animationDelay: `${idx * 70}ms`,
                  }}
                >
                  <span className="pointer-events-none absolute inset-0 opacity-0 bg-gradient-to-r from-white/0 via-white/45 to-white/0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <div className="relative z-10 flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
                    >
                      <SkillIcon
                        name={item.icon}
                        fallback="arrow_outward"
                        className="text-[17px]"
                      />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                        {item.label}
                      </p>
                      {item.note && (
                        <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
                          {item.note}
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-medium text-primary/85">
                          {item.url}
                        </span>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.chip}`}
                        >
                          {item.cta || "Mở ngay"}
                          <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                            →
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </LiquidGlass>
            );
          })}
        </div>

        <style jsx>{`
          @keyframes glassRise {
            from {
              opacity: 0;
              transform: translateY(8px) scale(0.985);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
    </LiquidGlass>
  );
}
