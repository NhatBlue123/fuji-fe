"use client";

import { use } from "react";
import CourseDetailView from "@/components/user-component/course/CourseDetailView";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  return <CourseDetailView courseId={Number(courseId)} />;
}
