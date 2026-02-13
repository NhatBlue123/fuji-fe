"use client";

import { use } from "react";
import LessonView from "@/components/user-component/course/LessonView";

export default function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = use(params);
  return <LessonView courseId={Number(courseId)} lessonId={Number(lessonId)} />;
}
