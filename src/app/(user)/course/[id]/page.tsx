"use client";

import { use } from "react";
import CourseDetailView from "@/components/user-component/course/CourseDetailView";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CourseDetailView courseId={Number(id)} />;
}
