"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface DeleteCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
}

export function DeleteCourseDialog({
  open,
  onOpenChange,
  courseTitle,
  isDeleting = false,
  onConfirm,
}: DeleteCourseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa khóa học</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa khóa học
            {courseTitle ? ` \"${courseTitle}\"` : " này"}? Toàn bộ bài học và
            dữ liệu liên quan sẽ bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Đang xóa...
              </>
            ) : (
              "Xóa khóa học"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
