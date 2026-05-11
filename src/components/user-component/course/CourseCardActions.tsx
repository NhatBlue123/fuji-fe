"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

function formatHoaPrice(price: unknown): string {
  const value = Number(price ?? 0);
  const amount = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${amount.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} 🌸`;
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
  const { isAuthenticated } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [purchaseCourse] = usePurchaseCourseMutation();

  const { data: userCourse, isFetching } = useGetCourseByIdQuery(courseId, {
    skip: !isAuthenticated,
  });

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
    } catch (error: any) {
      const msg = tMsg(error?.data?.messageKey) || tMsg("api.error");
      toast.error(msg);
    } finally {
      setIsRegistering(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Link
        href={detailHref}
        className="w-full py-2.5 rounded-lg border border-secondary text-center text-secondary font-bold hover:bg-secondary hover:text-secondary-foreground transition-colors text-sm"
      >
        Xem chi tiết
      </Link>
    );
  }

  const actionLabel = isEnrolled
    ? "Học tiếp"
    : freeCourse
      ? "Đăng ký"
      : formatHoaPrice(price);

  return (
    <div className="flex gap-3">
      <Link
        href={detailHref}
        className="flex-1 py-2.5 rounded-lg border border-input text-center text-muted-foreground font-bold hover:bg-muted hover:text-foreground hover:border-border transition-colors text-sm"
      >
        Xem chi tiết
      </Link>
      <Button
        onClick={handleAction}
        disabled={isFetching || isRegistering}
        className="flex-1 py-2.5 rounded-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold transition-all shadow-lg shadow-secondary/20 text-sm hover:shadow-secondary/40"
      >
        {isFetching || isRegistering ? "Đang xử lý..." : actionLabel}
      </Button>
    </div>
  );
}
