"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  ChevronDown,
  Clock3,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { useGetDiscoverySlotsQuery } from "@/store/services/bookingApi";

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
type JlptLevel = (typeof JLPT_LEVELS)[number];
type LevelFilter = "ALL" | JlptLevel;

type TeacherCard = {
  teacherId: number;
  teacherName: string;
  teacherAvatarUrl: string | null;
  primarySubjectLabel: string;
  subjectTypes: string[];
  levels: JlptLevel[];
  slotCount: number;
  firstTimeLabel: string;
  previewTimes: string[];
};

type TeacherAccumulator = {
  teacherId: number;
  teacherName: string;
  teacherAvatarUrl: string | null;
  primarySubjectLabel: string;
  subjectTypeSet: Set<string>;
  levelSet: Set<JlptLevel>;
  slotCount: number;
  firstTimeLabel: string;
  previewTimes: string[];
};

function toYmd(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatFullDate(value: string, locale: string) {
  return parseLocalDate(value).toLocaleDateString(locale === "vi" ? "vi-VN" : locale === "ja" ? "ja-JP" : "en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(value: string, locale: string) {
  return parseLocalDate(value).toLocaleDateString(locale === "vi" ? "vi-VN" : locale === "ja" ? "ja-JP" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const hhmm = (date: Date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;

  return `${hhmm(start)} - ${hhmm(end)}`;
}

function extractJlptLevel(subject?: string | null): JlptLevel | null {
  if (!subject) return null;
  const match = subject.toUpperCase().match(/\bN[1-5]\b/);
  if (!match) return null;
  return match[0] as JlptLevel;
}

function extractSubjectType(subject?: string | null) {
  if (!subject) return null;

  const cleaned = subject
    .replace(/\bN[1-5]\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || subject.trim();
}

export default function BookingPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [keyword, setKeyword] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("ALL");
  const [selectedDate, setSelectedDate] = useState(() => toYmd(new Date()));
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const { data, isLoading, isFetching, isError } = useGetDiscoverySlotsQuery({
    date: selectedDate,
    keyword: keyword.trim() || undefined,
  });

  const availableSlots = useMemo(() => {
    return [...(data?.items ?? [])]
      .filter((slot) => new Date(slot.startAt).getTime() > now.getTime())
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
  }, [data, now]);

  const subjectOptions = useMemo(() => {
    return Array.from(
      new Set(
        availableSlots
          .map((slot) => extractSubjectType(slot.subject))
          .filter((subject): subject is string => Boolean(subject))
      )
    ).sort((a, b) => a.localeCompare(b, i18n.language));
  }, [availableSlots, i18n.language]);

  const filteredSlots = useMemo(() => {
    return availableSlots.filter((slot) => {
      const slotSubjectType = extractSubjectType(slot.subject);
      const slotLevel = extractJlptLevel(slot.subject);

      const matchedSubject =
        subjectFilter === "ALL" || slotSubjectType === subjectFilter;
      const matchedLevel =
        levelFilter === "ALL" || slotLevel === levelFilter;

      return matchedSubject && matchedLevel;
    });
  }, [availableSlots, subjectFilter, levelFilter]);

  useEffect(() => {
    if (subjectFilter !== "ALL" && !subjectOptions.includes(subjectFilter)) {
      setSubjectFilter("ALL");
    }
  }, [subjectFilter, subjectOptions]);

  const teacherCards = useMemo(() => {
    const grouped = new Map<number, TeacherAccumulator>();

    filteredSlots.forEach((slot) => {
      const timeLabel = formatTimeRange(slot.startAt, slot.endAt);
      const subjectType = extractSubjectType(slot.subject);
      const level = extractJlptLevel(slot.subject);
      const current = grouped.get(slot.teacherId);

      if (!current) {
        grouped.set(slot.teacherId, {
          teacherId: slot.teacherId,
          teacherName: slot.teacherName,
          teacherAvatarUrl: slot.teacherAvatarUrl,
          primarySubjectLabel: slot.subject || t("booking.instructorEmpty"),
          subjectTypeSet: new Set(subjectType ? [subjectType] : []),
          levelSet: new Set(level ? [level] : []),
          slotCount: 1,
          firstTimeLabel: timeLabel,
          previewTimes: [timeLabel],
        });
        return;
      }

      current.slotCount += 1;

      if (subjectType) {
        current.subjectTypeSet.add(subjectType);
      }

      if (level) {
        current.levelSet.add(level);
      }

      if (
        !current.previewTimes.includes(timeLabel) &&
        current.previewTimes.length < 3
      ) {
        current.previewTimes.push(timeLabel);
      }
    });

    return [...grouped.values()]
      .map<TeacherCard>((item) => ({
        teacherId: item.teacherId,
        teacherName: item.teacherName,
        teacherAvatarUrl: item.teacherAvatarUrl,
        primarySubjectLabel: item.primarySubjectLabel,
        subjectTypes: [...item.subjectTypeSet],
        levels: [...item.levelSet].sort(
          (a, b) => JLPT_LEVELS.indexOf(a) - JLPT_LEVELS.indexOf(b)
        ),
        slotCount: item.slotCount,
        firstTimeLabel: item.firstTimeLabel,
        previewTimes: item.previewTimes,
      }))
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName, i18n.language));
  }, [filteredSlots, t, i18n.language]);

  const goToTeacherSchedule = (teacherId: number) => {
    router.push(`/booking/teacher-schedule?teacherId=${teacherId}`);
  };

  return (
    <main className="relative flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 text-foreground md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] bg-gradient-to-b from-primary/10 via-secondary/5 to-transparent" />
      <div className="pointer-events-none absolute -left-20 top-24 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-12 -z-10 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
              {t("booking.title").split("Sensei")[0]}<span className="text-secondary text-glow">Sensei</span>
            </h1>
            <p className="mt-3 text-base text-muted-foreground md:text-xl">
              {t("booking.subtitle")}
            </p>
          </div>

          <Link
            href="/booking/bookingmodal"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-secondary px-5 text-sm font-bold text-secondary-foreground shadow-sm transition hover:bg-secondary/90 active:scale-95"
          >
            {t("booking.mySchedule")}
          </Link>
        </section>

        <section className="mb-6 flex items-center justify-between">
          <div className="flex-1" />
          
          <div className="group relative">
            <button
              type="button"
              className="flex h-8 items-center gap-2 rounded-full border border-border bg-card/80 px-3 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              onClick={(e) => {
                const popover = e.currentTarget.nextElementSibling as HTMLElement;
                if (popover) {
                  popover.classList.toggle('hidden');
                }
              }}
            >
              <span>{t("booking.rules.title")}</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                <circle cx="2" cy="8" r="1.5"/>
                <circle cx="8" cy="8" r="1.5"/>
                <circle cx="14" cy="8" r="1.5"/>
              </svg>
            </button>
            
            <div className="absolute right-0 top-10 z-50 hidden w-80 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-lg backdrop-blur-sm dark:border-amber-400/40 dark:bg-amber-400/10">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-5" />
                <h2 className="text-sm font-bold">{t("booking.rules.title")}</h2>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                <li className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{t("booking.rules.rule1")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{t("booking.rules.rule2")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Ban className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{t("booking.rules.rule3")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Ban className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{t("booking.rules.rule4")}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] border border-border/60 p-4 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)] md:p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_180px_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t("booking.searchPlaceholder")}
                className="h-11 w-full rounded-lg border border-border bg-background/80 pl-12 pr-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="relative block">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-border bg-background/80 px-4 pr-11 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">{t("booking.allSubjects")}</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            </label>

            <label className="relative block">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
                className="h-11 w-full appearance-none rounded-lg border border-border bg-background/80 px-4 pr-11 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">{t("booking.allLevels")}</option>
                {JLPT_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            </label>

            <label className="relative block cursor-pointer">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background/80 pl-12 pr-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 
                           [color-scheme:dark] 
                           [&::-webkit-calendar-picker-indicator]:bg-none
                           [&::-webkit-calendar-picker-indicator]:absolute 
                           [&::-webkit-calendar-picker-indicator]:inset-0 
                           [&::-webkit-calendar-picker-indicator]:w-full 
                           [&::-webkit-calendar-picker-indicator]:h-full 
                           [&::-webkit-calendar-picker-indicator]:opacity-0 
                           [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </label>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-lg font-medium text-muted-foreground">
            {t("booking.availableTeachers", { count: teacherCards.length })}
          </p>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
            <CalendarDays className="size-4 text-primary" />
            <span>{formatFullDate(selectedDate, i18n.language)}</span>
          </div>
        </div>

        {(isLoading || isFetching) && (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[420px] animate-pulse rounded-[2rem] border border-border bg-card/70"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="mt-6 rounded-[2rem] border border-destructive/20 bg-destructive/5 px-6 py-5 text-sm text-destructive">
            {t("booking.fetchError")}
          </div>
        )}

        {!isLoading && !isFetching && !isError && teacherCards.length === 0 && (
          <div className="mt-6 rounded-[2rem] border border-dashed border-border bg-card/60 px-6 py-10 text-center">
            <p className="text-xl font-semibold text-foreground">
              {t("booking.noTeachers")}
            </p>
            <p className="mt-2 text-muted-foreground">
              {t("booking.tryAgain")}
            </p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && teacherCards.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {teacherCards.map((teacher) => (
              <article
                key={teacher.teacherId}
                className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border bg-card/90 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.4)] backdrop-blur"
              >
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-5">
  <div className="flex min-w-0 flex-1 items-center gap-3">
    <img
      src={teacher.teacherAvatarUrl || "/images/avt-default.jpg"}
      alt={teacher.teacherName}
      className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-secondary/10"
    />

    <div className="min-w-0 flex-1">
      <h2 className="text-lg font-black tracking-tight text-foreground truncate">
        {teacher.teacherName}
      </h2>
    </div>
  </div>

  <div className="flex shrink-0 items-center max-w-[40%]">
    <span className="inline-flex rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary whitespace-nowrap">
      {teacher.primarySubjectLabel}
    </span>
  </div>
</div>

                  <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock3 className="size-4 text-secondary" />
                      <span>{t("booking.slotRemaining", { count: teacher.slotCount })}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-secondary" />
                      <span>{t("booking.earliest", { time: teacher.firstTimeLabel })}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-secondary" />
                      <span>{t("booking.groupSubject", { count: teacher.subjectTypes.length || 1 })}</span>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-muted-foreground">
                    {t("booking.infoDescription", { 
                      count: teacher.slotCount, 
                      date: formatShortDate(selectedDate, i18n.language) 
                    })}
                  </p>

                  {teacher.previewTimes.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {teacher.previewTimes.map((time) => (
                        <span
                          key={`${teacher.teacherId}-${time}`}
                          className="rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border bg-muted/20 px-6 py-5">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => goToTeacherSchedule(teacher.teacherId)}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5 active:scale-95"
                    >
                     {t("booking.viewProfile")}
                    </button>

                    <button
                      type="button"
                      onClick={() => goToTeacherSchedule(teacher.teacherId)}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground shadow-lg shadow-secondary/20 transition hover:bg-secondary/90 active:scale-95"
                    >
                      {t("booking.bookNow")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}