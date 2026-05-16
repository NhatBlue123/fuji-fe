"use client";

import { Trans, useTranslation } from "react-i18next";

function localeFromLanguage(language: string) {
  if (language.startsWith("ja")) return "ja-JP";
  if (language.startsWith("en")) return "en-US";
  return "vi-VN";
}

function formatCount(value: number, locale: string) {
  if (value > 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString(locale);
}

export function CoursePageHeroText() {
  const { t } = useTranslation();

  return (
    <>
      <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 drop-shadow-[0_3px_16px_rgba(0,0,0,0.45)]">
        <Trans
          i18nKey="course.page.heroTitle"
          components={{
            brand: <span className="text-secondary text-glow" />,
          }}
        />
      </h1>
      <p className="text-white/95 text-lg md:text-xl font-semibold max-w-xl md:max-w-2xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
        {t("course.page.heroSubtitle")}
      </p>
    </>
  );
}

export function CourseListHeading() {
  const { t } = useTranslation();

  return (
    <>
      <span className="material-symbols-outlined text-secondary">auto_awesome</span>
      {t("course.list.featuredCourses")}
    </>
  );
}

export function CoursePriceBadge({ price }: { price: number | null | undefined }) {
  const { t, i18n } = useTranslation();
  const value = Number(price ?? 0);

  if (!Number.isFinite(value) || value <= 0) {
    return <>{t("course.list.free")}</>;
  }

  return (
    <>
      {value.toLocaleString(localeFromLanguage(i18n.language), {
        maximumFractionDigits: 2,
      })}{" "}
      🌸
    </>
  );
}

export function CourseInstructorLine({ name }: { name: string }) {
  const { t } = useTranslation();

  return (
    <>
      {t("course.list.instructor")}:{" "}
      <span className="font-medium text-foreground">{name}</span>
    </>
  );
}

export function CourseLessonCount({ count }: { count: number }) {
  const { t, i18n } = useTranslation();

  return (
    <>
      {t("course.list.lessons", {
        count: formatCount(count, localeFromLanguage(i18n.language)),
      })}
    </>
  );
}

export function CourseStudentCount({ count }: { count: number }) {
  const { t, i18n } = useTranslation();

  return (
    <>
      {t("course.list.students", {
        count: formatCount(count, localeFromLanguage(i18n.language)),
      })}
    </>
  );
}
