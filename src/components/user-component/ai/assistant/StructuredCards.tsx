"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import LiquidGlass from "@/components/ui/liquid-glass-safe";
import type {
  ActionLinkItem,
  CourseComparePayload,
  CoursePreviewItem,
  PaymentActionPayload,
  StructuredBlockType,
} from "./types";

const glassCardProps = {
  displacementScale: 74,
  blurAmount: 0.075,
  saturation: 154,
  elasticity: 0.16,
  mode: "prominent" as const,
};

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
              animation: "glassRise 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
              animationDelay: `${idx * 55}ms`,
            }}
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.7),transparent_55%)]" />
            <span className="pointer-events-none absolute -left-8 top-0 h-12 w-56 -translate-y-1/2 rotate-[8deg] bg-gradient-to-r from-transparent via-white/65 to-transparent blur-xl transition-transform duration-700 group-hover:translate-y-8" />

            <div className="relative flex gap-3 rounded-[14px] bg-white/74 p-3 backdrop-blur-xl dark:bg-slate-900/55">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-white/55 bg-white/55 shadow-inner dark:border-white/10 dark:bg-slate-800/50">
                {item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover saturate-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground/90">
                    No preview
                  </div>
                )}
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

export function CourseCompareTable({ payload }: { payload: CourseComparePayload }) {
  if (payload.columns.length === 0 || payload.rows.length === 0) {
    return null;
  }

  return (
    <LiquidGlass {...glassCardProps} cornerRadius={18} className="my-4 rounded-2xl">
      <div className="overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/82 via-white/56 to-sky-100/45 dark:border-white/15 dark:from-slate-900/72 dark:via-slate-900/56 dark:to-slate-800/45">
        {payload.title && (
          <div className="border-b border-white/45 bg-white/45 px-3 py-2 text-sm font-semibold text-foreground backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            {payload.title}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="bg-white/45 dark:bg-white/5">
                <th className="w-40 border-b border-r border-white/40 px-3 py-2 text-left text-xs font-semibold text-muted-foreground dark:border-white/10">
                  Thuộc tính
                </th>
                {payload.columns.map((column) => (
                  <th
                    key={column.id}
                    className="border-b border-white/40 px-3 py-3 align-top dark:border-white/10"
                  >
                    <Link
                      href={column.url}
                      className="group block overflow-hidden rounded-lg border border-white/50 bg-white/55 transition-all hover:border-primary/40 dark:border-white/10 dark:bg-slate-900/45"
                    >
                      <div className="h-28 w-full overflow-hidden bg-muted/60">
                        {column.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={column.thumbnail}
                            alt={column.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            No preview
                          </div>
                        )}
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

export function PaymentActionCard({ payload }: { payload: PaymentActionPayload }) {
  return (
    <LiquidGlass {...glassCardProps} cornerRadius={18} className="my-3 rounded-2xl">
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/85 via-primary/10 to-sky-100/45 p-3.5 shadow-[0_18px_42px_-30px_rgba(37,99,235,0.45)] dark:border-white/15 dark:from-slate-900/70 dark:via-slate-900/58 dark:to-slate-800/45">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(191,219,254,0.45),transparent_52%)]" />
        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{payload.label}</p>
            {payload.note && (
              <p className="mt-1 text-xs text-muted-foreground">{payload.note}</p>
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
    <LiquidGlass {...glassCardProps} cornerRadius={22} className="my-4 rounded-[1.35rem]">
      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/60 bg-gradient-to-br from-white/85 via-sky-50/55 to-blue-100/40 p-4 shadow-[0_24px_56px_-34px_rgba(37,99,235,0.45)] dark:border-white/15 dark:from-slate-900/72 dark:via-slate-900/58 dark:to-slate-800/45">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_8%,rgba(147,197,253,0.45),transparent_52%)]" />
        <span className="pointer-events-none absolute -left-12 top-0 h-16 w-72 -translate-y-1/2 rotate-[6deg] bg-gradient-to-r from-transparent via-white/70 to-transparent blur-xl" />

        <p className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
          Fuji Smart Links
        </p>
        <div className="relative z-10 mt-3 grid gap-2.5 sm:grid-cols-2">
          {links.map((item, idx) => (
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
                className="group relative block overflow-hidden rounded-xl border border-white/70 bg-white/70 px-3.5 py-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_30px_-20px_rgba(37,99,235,0.5)] dark:border-white/15 dark:bg-slate-900/55"
                style={{
                  animation:
                    "glassRise 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
                  animationDelay: `${idx * 70}ms`,
                }}
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 bg-gradient-to-r from-white/0 via-white/45 to-white/0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <div className="relative z-10 flex items-start gap-2">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-white/55 bg-primary/15 text-[11px] text-primary dark:border-white/20">
                    →
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-primary/80">
                      {item.url}
                    </p>
                    {item.note && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </LiquidGlass>
          ))}
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
