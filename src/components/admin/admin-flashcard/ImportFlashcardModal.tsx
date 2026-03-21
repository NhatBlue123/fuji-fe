"use client";

import React, { useState, Fragment, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Check,
    Download,
    Upload,
    ArrowRight,
    ArrowLeft,
    Loader2,
    FileSpreadsheet,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { downloadExcelTemplate } from "./flashcardUtils";
import { useImportFlashcardsMutation } from "@/store/services/admin/flashcardApi";
import { useGetAllCoursesQuery } from "@/store/services/courseApi";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ImportFlashcardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportSuccess?: () => void;
}

export const ImportFlashcardModal: React.FC<ImportFlashcardModalProps> = ({
    open,
    onOpenChange,
    onImportSuccess,
}) => {
    const [step, setStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedLesson, setSelectedLesson] = useState("");

    const [importFlashcards, { isLoading: isUploading }] = useImportFlashcardsMutation();
    const { data: courseData } = useGetAllCoursesQuery({ size: 100 });

    useEffect(() => {
        if (!open) {
            setStep(1);
            setSelectedFile(null);
            setSelectedLesson("");
        }
    }, [open]);

    const handleNextStep = () => {
        if (step === 2 && !selectedFile) {
            toast.warning("Vui lòng tải lên file Excel");
            return;
        }
        if (step < 3) setStep(step + 1);
    };

    const handlePrevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const validExtensions = ['.xlsx', '.xls', '.csv'];
            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            
            if (!validExtensions.includes(fileExtension)) {
                toast.error("Định dạng file không hỗ trợ");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !selectedLesson) return;

        try {
            const response = await importFlashcards({ 
                file: selectedFile, 
                lesson: selectedLesson 
            }).unwrap();

            toast.success(response.message || "Import thành công!");
            onImportSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.data?.message || "Nhập dữ liệu thất bại");
        }
    };

    const lessons = courseData?.content.map(c => c.title) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <FileSpreadsheet className="size-5 text-muted-foreground" />
                        <DialogTitle>Nhập từ vựng Excel</DialogTitle>
                    </div>
                    <DialogDescription>
                        Làm theo ba bước bên dưới để đồng bộ dữ liệu nhanh vào hệ thống.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between mb-8 px-4">
                        {[1, 2, 3].map((s) => (
                            <Fragment key={s}>
                                <div className={cn(
                                    "size-8 rounded-full border flex items-center justify-center text-xs font-medium transition-colors cursor-default",
                                    step >= s ? "bg-primary border-primary text-primary-foreground shadow-sm" : "bg-muted border-slate-200 text-muted-foreground"
                                )}>
                                    {step > s ? <Check className="size-4" /> : s}
                                </div>
                                {s < 3 && <div className={cn("flex-1 h-[2px] mx-1 rounded-full", step > s ? "bg-primary" : "bg-muted")} />}
                            </Fragment>
                        ))}
                    </div>

                    <div className="min-h-[100px] flex flex-col justify-center">
                        {step === 1 && (
                            <div className="space-y-4 text-center">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold">Tải tệp tin mẫu</h4>
                                    <p className="text-xs text-muted-foreground px-4">Đảm bảo cấu trúc cột chính xác để tránh lỗi đồng bộ.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={downloadExcelTemplate} className="gap-2">
                                    <Download className="size-4" /> Template_Flashcards.xlsx
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold">Chọn thư mục/tệp tin (.xlsx, .csv)</Label>
                                <label className={cn(
                                    "flex flex-col items-center justify-center h-32 w-full rounded-md border border-dashed hover:bg-muted/50 transition-all cursor-pointer group",
                                    selectedFile ? "border-primary bg-primary/5" : "border-slate-200 bg-muted/30"
                                )}>
                                    {selectedFile ? (
                                        <div className="flex flex-col items-center px-4">
                                            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                                                <Check className="size-4 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-900 truncate w-full max-w-[300px] text-center">{selectedFile.name}</span>
                                            <span className="text-[10px] text-muted-foreground mt-1">Sẵn sàng để nhập</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="size-6 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                                            <span className="text-sm font-medium text-muted-foreground">Nhấp để chọn tệp Excel</span>
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                                </label>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold">Gán vào bài học hệ thống</Label>
                                    <Select value={selectedLesson} onValueChange={setSelectedLesson}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn cấp độ/bài học..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {lessons.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                            <SelectItem value="Tự do">Khác (Flashcard tự do)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-md flex gap-2">
                                    <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-700 leading-normal font-medium italic">Hệ thống sẽ đồng bộ toàn bộ nội dung trong tệp vào bài: <span className="underline">{selectedLesson || "..."}</span></p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 pt-2 border-t">
                    <div className="flex-1 flex gap-2">
                         {step > 1 && (
                            <Button variant="ghost" size="sm" onClick={handlePrevStep} className="gap-2">
                                <ArrowLeft className="size-4" /> Quay lại
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {step < 3 ? (
                            <Button size="sm" onClick={handleNextStep} className="gap-2">
                                Tiếp tục <ArrowRight className="size-4" />
                            </Button>
                        ) : (
                            <Button size="sm" onClick={handleUpload} disabled={isUploading || !selectedLesson} className="gap-2">
                                {isUploading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <FileSpreadsheet className="size-4" />
                                )}
                                Xác nhận nhập
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
