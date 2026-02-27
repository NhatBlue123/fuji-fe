"use client";

import React, { useState, useEffect } from "react";
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
import { Layers, Plus, Loader2, Edit3, Save, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { FlashcardSet } from "@/types/flashcard";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";


interface CreateFlashcardSetModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editData?: FlashcardSet | null;
    onCreateSuccess?: (data: Partial<FlashcardSet>) => void;
    onUpdateSuccess?: (data: FlashcardSet) => void;
}

export const CreateFlashcardSetModal = ({
    open,
    onOpenChange,
    editData = null,
    onCreateSuccess,
    onUpdateSuccess,
}: CreateFlashcardSetModalProps) => {
    const [name, setName] = useState("");
    const [lesson, setLesson] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [openCourse, setOpenCourse] = useState(false);

    const courses = [
        "JLPT N5 Comprehensive",
        "JLPT N4 Grammar Foundation",
        "JLPT N3 Intermediate",
    ];

    useEffect(() => {
        if (editData) {
            setName(editData.name || "");
            setLesson(editData.lesson || "");
            setDescription(editData.description || "");
        } else {
            setName("");
            setLesson("");
            setDescription("");
        }
    }, [editData, open]);

    const handleSubmit = async () => {
        if (!name.trim() || !lesson) {
            toast.error("Vui lòng điền tên bộ chứa và chọn khóa học");
            return;
        }

        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (editData) {
                const payload: FlashcardSet = {
                    ...editData,
                    name,
                    lesson,
                    description,
                };
                onUpdateSuccess?.(payload);
                toast.success("Cập nhật bộ chứa thành công!");
            } else {
                const payload: Partial<FlashcardSet> = {
                    name,
                    lesson,
                    description,
                    numCards: 0,
                    createdAt: new Date().toLocaleDateString('vi-VN'),
                    status: "Active"
                };
                onCreateSuccess?.(payload);
                toast.success("Tạo bộ chứa thẻ thành công!");
            }

            onOpenChange(false);
        } catch (error) {
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-2xl border border-slate-100 shadow-xl">
                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-2xl", editData ? "bg-indigo-100" : "bg-indigo-50")}>
                                {editData ? (
                                    <Edit3 className="size-6 text-indigo-600" />
                                ) : (
                                    <Layers className="size-6 text-indigo-600" />
                                )}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                    {editData ? "Chỉnh Sửa Bộ Chứa" : "Tạo Bộ Chứa Mới"}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-bold">
                                    {editData ? "Cập nhật lại thông tin định danh của bộ thẻ." : "Tạo không gian để quản lý các thẻ học theo chủ đề."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                                Tên Bộ Chứa Thẻ *
                            </Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ví dụ: N5 Kanji Bài 1"
                                className="h-12 border-slate-200 rounded-xl font-bold px-4 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                            />
                        </div>

                        <Popover open={openCourse} onOpenChange={setOpenCourse}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 justify-between rounded-xl border-slate-200 font-medium"
                                >
                                    {lesson || "Chọn hoặc tìm khóa học..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-full p-0 rounded-xl border-slate-100 shadow-xl">
                                <Command>
                                    <CommandInput placeholder="Tìm khóa học..." />
                                    <CommandList>
                                        <CommandEmpty>Không tìm thấy khóa học.</CommandEmpty>

                                        {courses.map((course) => (
                                            <CommandItem
                                                key={course}
                                                onSelect={() => {
                                                    setLesson(course);
                                                    setOpenCourse(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        lesson === course ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {course}
                                            </CommandItem>
                                        ))}

                                        <CommandItem
                                            onSelect={() => {
                                                toast.info("Mở modal tạo khóa học mới");
                                            }}
                                            className="text-indigo-600 font-semibold"
                                        >
                                            + Tạo khóa học mới
                                        </CommandItem>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>


                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                                Mô tả ngắn gọn
                            </Label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full min-h-[80px] p-4 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm resize-none text-sm"
                                placeholder="Mô tả về mục tiêu hoặc nội dung của bộ thẻ này..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-8 gap-3 sm:justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 border-none"
                        >
                            {isSubmitting ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <>
                                    {editData ? <Save className="size-5" /> : <Plus className="size-5 stroke-[3px]" />}
                                    {editData ? "Lưu Thay Đổi" : "Tạo Bộ Mới"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};
