"use client";

import { use } from "react";
import { LessonForm } from "@/components/admin/admin-components/lesson-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default function NewLessonPage({ params }: Props) {
  const { id } = use(params);
  return <LessonForm courseId={Number(id)} />;
}
