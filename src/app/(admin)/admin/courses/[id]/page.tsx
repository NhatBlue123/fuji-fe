"use client";

import { use } from "react";
import { CourseDetailView } from "@/components/admin/course/CourseDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CourseDetailPage({ params }: Props) {
  const { id } = use(params);
  return <CourseDetailView courseId={Number(id)} />;
}
