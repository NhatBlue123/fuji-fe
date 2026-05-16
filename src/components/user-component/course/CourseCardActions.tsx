"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tMsg } from "@/i18n";
import { useAuth } from "@/store/hooks";
import {
  useGetCourseByIdQuery,
  usePurchaseCourseMutation,
} from "@/store/services/courseApi";

function isFreePrice(price: unknown): boolean {
  const value = Number(price ?? 0);
  return Number.isFinite(value) && value <= 0;
}

function formatHoaPrice(price: unknown, locale: string): string {
  const value = Number(price ?? 0);
  const amount = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${amount.toLocaleString(locale, { maximumFractionDigits: 2 })} 🌸`;
}

function getApiMessageKey(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return undefined;
  }

  const data = (error as { data?: { messageKey?: unknown } }).data;
  return typeof data?.messageKey === "string" ? data.messageKey : undefined;
}

interface CourseCardActionsProps {
  courseId: number;
  detailHref: string;
  price: number | null | undefined;
}

export default function CourseCardActions({
  courseId,
  detailHref,
  price,
}: CourseCardActionsProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [purchaseCourse] = usePurchaseCourseMutation();

  const { data: userCourse, isFetching } = useGetCourseByIdQuery(courseId, {
    skip: !mounted || !isAuthenticated,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const freeCourse = isFreePrice(price);
  const isEnrolled = Boolean(userCourse?.isEnrolled);
  const resumeHref = userCourse?.currentLessonId
    ? `/course/${courseId}/lesson/${userCourse.currentLessonId}`
    : detailHref;

  const handleAction = async () => {
    if (isEnrolled) {
      router.push(resumeHref);
      return;
    }

    if (!freeCourse) {
      router.push(detailHref);
      return;
    }

    try {
      setIsRegistering(true);
      await purchaseCourse({ courseId }).unwrap();
      // Backend will send notification, no need for toast here
      router.push(resumeHref);
    } catch (error: unknown) {
      const msg = tMsg(getApiMessageKey(error)) || tMsg("api.error");
      toast.error(msg);
    } finally {
      setIsRegistering(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <Link
        href={detailHref}
        className="w-full py-2.5 rounded-lg border border-secondary text-center text-secondary font-bold hover:bg-secondary hover:text-secondary-foreground transition-colors text-sm"
      >
        {t("course.list.viewDetails")}
      </Link>
    );
  }

  const locale = i18n.language.startsWith("ja")
    ? "ja-JP"
    : i18n.language.startsWith("en")
      ? "en-US"
      : "vi-VN";
  const actionLabel = isEnrolled
    ? t("course.list.continueLearning")
    : freeCourse
      ? t("course.list.register")
      : formatHoaPrice(price, locale);

  return (
    <div className="flex gap-3">
      <Link
        href={detailHref}
        className="flex-1 py-2.5 rounded-lg border border-input text-center text-muted-foreground font-bold hover:bg-muted hover:text-foreground hover:border-border transition-colors text-sm"
      >
        {t("course.list.viewDetails")}
      </Link>
      <Button
        onClick={handleAction}
        disabled={isFetching || isRegistering}
        className="flex-1 py-2.5 rounded-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold transition-all shadow-lg shadow-secondary/20 text-sm hover:shadow-secondary/40"
      >
        {isFetching || isRegistering ? t("course.list.processing") : actionLabel}
      </Button>
    </div>
  );
}
