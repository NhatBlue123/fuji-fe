"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CourseHeaderProps {
  onCreateCourse?: () => void;
  totalCourses?: number;
}

export const CourseHeader: React.FC<CourseHeaderProps> = ({
  onCreateCourse,
  totalCourses,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý khóa học</h1>
        <p className="text-muted-foreground">
          {totalCourses !== undefined
            ? `${totalCourses} khóa học — Quản lý chương trình và theo dõi tiến độ.`
            : "Quản lý chương trình và theo dõi tiến độ học viên."}
        </p>
      </div>
      {onCreateCourse && (
        <Button onClick={onCreateCourse} className="gap-2">
          <Plus className="size-4" />
          Tạo khóa học
        </Button>
      )}
    </div>
  );
};
