"use client";

import { use } from "react";
import LessonView from "@/components/user-component/course/LessonView";

export default function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = use(params);
  const courseIdMatch = slug.match(/(?:^|-)(\d+)$/);
  const courseId = courseIdMatch ? Number(courseIdMatch[1]) : Number(slug);
  return <LessonView courseId={Number(courseId)} lessonId={Number(lessonId)} />;
}
