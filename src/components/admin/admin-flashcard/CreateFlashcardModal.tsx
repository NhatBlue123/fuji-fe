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
import { Plus, Sparkles, Languages, MessageSquarePlus, Loader2, Save, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Flashcard } from "@/types/flashcard";

interface CreateFlashcardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateSuccess?: (data: Partial<Flashcard>) => void;
    onUpdateSuccess?: (data: Flashcard) => void;
    editData?: Flashcard | null;
}

export const CreateFlashcardModal = ({
    open,
    onOpenChange,
    onCreateSuccess,
    onUpdateSuccess,
    editData = null,
}: CreateFlashcardModalProps) => {
    const [kanji, setKanji] = useState("");
    const [hiragana, setHiragana] = useState("");
    const [meaning, setMeaning] = useState("");
    const [example, setExample] = useState("");
    const [lesson, setLesson] = useState("");
    const [type, setType] = useState("Vocabulary");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editData) {
            setKanji(editData.kanji || "");
            setHiragana(editData.hiragana || "");
            setMeaning(editData.meaning || "");
            setExample(editData.example || "");
            setLesson(editData.lesson || "");
            setType(editData.type || "Vocabulary");
        } else {
            setKanji("");
            setHiragana("");
            setMeaning("");
            setExample("");
            setLesson("");
            setType("Vocabulary");
        }
    }, [editData, open]);

    const handleSubmit = async () => {
        // Validation
        if (!kanji.trim() || !hiragana.trim() || !meaning.trim() || !lesson) {
            toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
            return;
        }

        setIsSubmitting(true);
        try {
            // Simulate API
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (editData) {
                const payload: Flashcard = {
                    ...editData,
                    kanji,
                    hiragana,
                    meaning,
                    example,
                    lesson,
                    type
                };
                onUpdateSuccess?.(payload);
                toast.success("Cập nhật thẻ thành công!");
            } else {
                const payload: Partial<Flashcard> = {
                    kanji,
                    hiragana,
                    meaning,
                    example,
                    lesson,
                    type
                };
                onCreateSuccess?.(payload);
                toast.success("Tạo thẻ mới thành công!");
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
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-2xl", editData ? "bg-indigo-50" : "bg-amber-50")}>
                                {editData ? (
                                    <Edit3 className="size-6 text-indigo-600" />
                                ) : (
                                    <Sparkles className="size-6 text-amber-600" />
                                )}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                    {editData ? "Chỉnh Sửa Thẻ" : "Tạo Thẻ Mới"}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-bold">
                                    {editData ? "Cập nhật lại nội dung kiến thức bài học." : "Thêm nội dung kiến thức mới vào bài học."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                                    <Languages className="size-3.5 text-amber-500" />
                                    Từ vựng / Ký tự *
                                </Label>
                                <Input
                                    value={kanji}
                                    onChange={(e) => setKanji(e.target.value)}
                                    placeholder="Ví dụ: 日本語"
                                    className="h-12 border-slate-200 rounded-xl font-bold px-4 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-japanese"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                                    Cách đọc *
                                </Label>
                                <Input
                                    value={hiragana}
                                    onChange={(e) => setHiragana(e.target.value)}
                                    placeholder="Ví dụ: にほんご"
                                    className="h-12 border-slate-200 rounded-xl font-bold px-4 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                                    Ý nghĩa *
                                </Label>
                                <Input
                                    value={meaning}
                                    onChange={(e) => setMeaning(e.target.value)}
                                    placeholder="Ví dụ: Tiếng Nhật"
                                    className="h-12 border-slate-200 rounded-xl font-bold px-4 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                                    Phân loại *
                                </Label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full h-12 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 bg-white cursor-pointer focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 shadow-sm transition-all text-sm appearance-none"
                                >
                                    <option value="Vocabulary">Từ vựng</option>
                                    <option value="Kanji">Kanji</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                                <MessageSquarePlus className="size-3.5 text-amber-500" />
                                Ví dụ minh họa
                            </Label>
                            <textarea
                                value={example}
                                onChange={(e) => setExample(e.target.value)}
                                className="w-full min-h-[100px] p-4 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-sm resize-none text-sm"
                                placeholder="Nhập câu ví dụ để dễ ghi nhớ hơn..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                                Thuộc bài học *
                            </Label>
                            <select
                                value={lesson}
                                onChange={(e) => setLesson(e.target.value)}
                                className="w-full h-12 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 bg-white cursor-pointer focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 shadow-sm transition-all text-sm appearance-none"
                            >
                                <option value="">-- Chọn bài học --</option>
                                <option value="N5 - Unit 1">N5 - Unit 1</option>
                                <option value="N5 - Unit 2">N5 - Unit 2</option>
                                <option value="N4 - Bài 10: Du lịch">N4 - Bài 10: Du lịch</option>
                            </select>
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
                            className={cn(
                                "h-12 px-8 text-white font-bold rounded-xl gap-2 shadow-lg transition-all active:scale-95 border-none",
                                editData ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20" : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                            )}
                        >
                            {isSubmitting ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <>
                                    {editData ? <Save className="size-5" /> : <Plus className="size-5 stroke-[3px]" />}
                                    {editData ? "Lưu Thay Đổi" : "Tạo Thẻ Mới"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};
