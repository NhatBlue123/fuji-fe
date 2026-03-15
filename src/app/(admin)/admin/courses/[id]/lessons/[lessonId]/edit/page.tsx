"use client";

import { use } from "react";
import { useGetLessonByIdQuery } from "@/store/services/courseApi";
import { LessonForm } from "@/components/admin/course/lesson-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string; lessonId: string }>;
}

export default function EditLessonPage({ params }: Props) {
  const { id, lessonId } = use(params);
  const courseId = Number(id);
  const {
    data: lesson,
    isLoading,
    error,
  } = useGetLessonByIdQuery(Number(lessonId));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Không tìm thấy bài học</p>
        <Button variant="outline" asChild>
          <Link href={`/admin/courses/${courseId}`}>
            <ArrowLeft className="size-4 mr-2" />
            Quay lại
          </Link>
        </Button>
      </div>
    );
  }

  return <LessonForm courseId={courseId} lesson={lesson} />;
}
