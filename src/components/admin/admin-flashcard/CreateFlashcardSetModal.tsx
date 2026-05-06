"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Layers, Plus, Loader2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { FlashcardSet } from "@/types/flashcard";
import { 
    useCreateFlashcardSetMutation, 
    useUpdateFlashcardSetMutation 
} from "@/store/services/admin/flashcardApi";

interface CreateFlashcardSetModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editData?: FlashcardSet | null;
    onSuccess?: () => void;
}

export const CreateFlashcardSetModal: React.FC<CreateFlashcardSetModalProps> = ({
    open,
    onOpenChange,
    editData = null,
    onSuccess,
}) => {
    const [name, setName] = useState("");
    const [lesson, setLesson] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);

    const [createSet, { isLoading: isCreating }] = useCreateFlashcardSetMutation();
    const [updateSet, { isLoading: isUpdating }] = useUpdateFlashcardSetMutation();

    const isSubmitting = isCreating || isUpdating;

    const resetForm = useCallback(() => {
        setName("");
        setLesson("");
        setDescription("");
        setIsPublic(true);
    }, []);

    useEffect(() => {
        if (open) {
            if (editData) {
                setName(editData.name || "");
                setLesson(editData.lesson || "");
                setDescription(editData.description || "");
                setIsPublic(editData.isPublic !== false);
            } else {
                resetForm();
            }
        }
    }, [editData, open, resetForm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error("Vui lòng nhập tiêu đề");
            return;
        }

        try {
            if (editData) {
                await updateSet({
                    id: editData.id,
                    data: { 
                        name: name.trim(), 
                        lesson: lesson.trim() || "Tự do",
                        description: description.trim(),
                        isPublic: isPublic
                    }
                }).unwrap();
                
                // Revalidate ISR pages
                fetch("/api/revalidate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "flashcard", action: "update" }),
                }).catch(() => {});
                
                toast.success("Cập nhật bộ thẻ thành công!");
            } else {
                await createSet({
                    name: name.trim(),
                    lesson: lesson.trim() || "Tự do",
                    description: description.trim(),
                    status: "Active",
                    isPublic: isPublic
                }).unwrap();
                
                // Revalidate ISR pages
                fetch("/api/revalidate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "flashcard", action: "create" }),
                }).catch(() => {});
                
                toast.success("Tạo bộ thẻ thành công!");
            }

            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
             // Extract error message specifically if available from API response
            const msg = error?.data?.message || error?.message || "Lưu dữ liệu thất bại";
            toast.error(msg);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        {editData ? <Edit3 className="size-5 text-muted-foreground" /> : <Layers className="size-5 text-muted-foreground" />}
                        <DialogTitle>{editData ? "Chỉnh sửa bộ thẻ" : "Tạo bộ thẻ mới"}</DialogTitle>
                    </div>
                    <DialogDescription>
                        Cập nhật các thông tin cơ bản cho bộ flashcards quản trị.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Tiêu đề <span className="text-destructive">*</span></Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-lesson">Phân loại (Bài học/Chương)</Label>
                        <Input
                            id="edit-lesson"
                            value={lesson}
                            onChange={(e) => setLesson(e.target.value)}
                            placeholder="VD: Bài 1, N5..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Mô tả</Label>
                        <Textarea
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[90px]"
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <p className="text-sm font-medium">Xuất bản</p>
                            <p className="text-xs text-muted-foreground">
                                Bật để hiển thị cho học viên
                            </p>
                        </div>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                        />
                    </div>

                    <DialogFooter className="gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                "Lưu thay đổi"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
