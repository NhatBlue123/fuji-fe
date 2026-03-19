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

interface DeleteFlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  type?: "set" | "card";
}

export function DeleteFlashcardDialog({
  open,
  onOpenChange,
  title,
  description,
  isDeleting = false,
  onConfirm,
  type = "set",
}: DeleteFlashcardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa {type === "set" ? "bộ thẻ" : "thẻ học"}</DialogTitle>
          <DialogDescription>
            {description || `Bạn có chắc chắn muốn xóa ${type === "set" ? "bộ thẻ" : "thẻ học"} ${title ? ` "${title}"` : "này"}?`}
            {type === "set" && " Tất cả thẻ kiến thức bên trong bộ này cũng sẽ bị xóa vĩnh viễn."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="px-5">
            Hủy
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-5"
          >
            {isDeleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
            ) : (
                `Xóa ${type === "set" ? "bộ thẻ" : "thẻ"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
