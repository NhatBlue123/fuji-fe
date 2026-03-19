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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { Flashcard } from "@/types/flashcard";
import { useGetAllCoursesQuery } from "@/store/services/courseApi";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateFlashcardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateSuccess?: (data: Partial<Flashcard>) => void;
    onUpdateSuccess?: (data: Flashcard) => void;
    editData?: Flashcard | null;
}

export const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
    open,
    onOpenChange,
    onCreateSuccess,
    onUpdateSuccess,
    editData = null,
}) => {
    const [kanji, setKanji] = useState("");
    const [hiragana, setHiragana] = useState("");
    const [meaning, setMeaning] = useState("");
    const [example, setExample] = useState("");
    const [lesson, setLesson] = useState("");
    const [type, setType] = useState("Vocabulary");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openLesson, setOpenLesson] = useState(false);

    const { data: courseData } = useGetAllCoursesQuery({ size: 100 });
    const lessons = courseData?.content.map(c => c.title) || [];

    const resetForm = useCallback(() => {
        setKanji("");
        setHiragana("");
        setMeaning("");
        setExample("");
        setLesson("");
        setType("Vocabulary");
    }, []);

    useEffect(() => {
        if (open) {
            if (editData) {
                setKanji(editData.kanji || "");
                setHiragana(editData.hiragana || "");
                setMeaning(editData.meaning || "");
                setExample(editData.example || "");
                setLesson(editData.lesson || "");
                setType(editData.type || "Vocabulary");
            } else {
                resetForm();
            }
        }
    }, [editData, open, resetForm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!kanji.trim()) {
            toast.error("Vui lòng nhập từ vựng/kanji");
            return;
        }
        if (!hiragana.trim()) {
            toast.error("Vui lòng nhập cách đọc");
            return;
        }
        if (!meaning.trim()) {
            toast.error("Vui lòng nhập ý nghĩa");
            return;
        }
        if (!lesson) {
            toast.error("Vui lòng chọn bài học");
            return;
        }

        setIsSubmitting(true);
        try {
            // Logic saved simulation
            await new Promise(resolve => setTimeout(resolve, 600));

            if (editData) {
                const payload: Flashcard = {
                    ...editData,
                    kanji: kanji.trim(),
                    hiragana: hiragana.trim(),
                    meaning: meaning.trim(),
                    example: example.trim(),
                    lesson,
                    type
                };
                onUpdateSuccess?.(payload);
                toast.success("Cập nhật thẻ thành công!");
            } else {
                const payload: Partial<Flashcard> = {
                    kanji: kanji.trim(),
                    hiragana: hiragana.trim(),
                    meaning: meaning.trim(),
                    example: example.trim(),
                    lesson,
                    type,
                    viewCount: 0,
                    studyStatus: "not_learned"
                };
                onCreateSuccess?.(payload);
                toast.success("Tạo thẻ mới thành công!");
            }

            onOpenChange(false);
        } catch (error) {
            toast.error("Lưu dữ liệu thất bại");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        {editData ? <Edit3 className="size-5 text-muted-foreground" /> : <Sparkles className="size-5 text-muted-foreground" />}
                        <DialogTitle>{editData ? "Chỉnh sửa thẻ học" : "Thêm thẻ học mới"}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {editData ? "Cập nhật nội dung chi tiết cho thẻ kiến thức." : "Nhập các thông tin cần thiết để tạo một thẻ học mới."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="kanji">Từ vựng / Kanji <span className="text-destructive">*</span></Label>
                            <Input
                                id="kanji"
                                value={kanji}
                                onChange={(e) => setKanji(e.target.value)}
                                placeholder="VD: 日本語"
                                className="font-japanese text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hiragana">Cách đọc <span className="text-destructive">*</span></Label>
                            <Input
                                id="hiragana"
                                value={hiragana}
                                onChange={(e) => setHiragana(e.target.value)}
                                placeholder="VD: にほんご"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="meaning">Ý nghĩa <span className="text-destructive">*</span></Label>
                            <Input
                                id="meaning"
                                value={meaning}
                                onChange={(e) => setMeaning(e.target.value)}
                                placeholder="VD: Tiếng Nhật"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phân loại</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại thẻ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Vocabulary">Từ vựng</SelectItem>
                                    <SelectItem value="Kanji">Hán tự</SelectItem>
                                    <SelectItem value="Grammar">Ngữ pháp</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Thuộc bài học <span className="text-destructive">*</span></Label>
                        <Popover open={openLesson} onOpenChange={setOpenLesson}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-between font-normal",
                                        !lesson && "text-muted-foreground"
                                    )}
                                >
                                    {lesson || "Chọn bài học để gán..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                    <CommandInput placeholder="Tìm bài học..." />
                                    <CommandList className="max-h-[200px]">
                                        <CommandEmpty className="py-2 px-4 text-sm">Không tìm thấy bài học</CommandEmpty>
                                        {lessons.map((l) => (
                                            <CommandItem
                                                key={l}
                                                onSelect={() => {
                                                    setLesson(l);
                                                    setOpenLesson(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", lesson === l ? "opacity-100" : "opacity-0")} />
                                                {l}
                                            </CommandItem>
                                        ))}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="example">Ví dụ minh họa</Label>
                        <Textarea
                            id="example"
                            value={example}
                            onChange={(e) => setExample(e.target.value)}
                            placeholder="Nhập câu ví dụ hoặc ghi chú thêm..."
                            className="min-h-[80px] resize-none"
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
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>{editData ? "Lưu thay đổi" : "Thêm thẻ"}</>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
