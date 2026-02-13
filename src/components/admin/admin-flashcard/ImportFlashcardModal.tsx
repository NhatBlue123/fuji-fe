"use client";

import React, { useState, Fragment } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
    Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { downloadExcelTemplate } from "./flashcardUtils";
import { Flashcard } from "@/types/flashcard";
import { importFlashcards } from "@/store/services/admin/flashcardApi";

interface ImportFlashcardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportSuccess: (data: Partial<Flashcard>[]) => void;
}

export const ImportFlashcardModal = ({
    open,
    onOpenChange,
    onImportSuccess,
}: ImportFlashcardModalProps) => {
    const [step, setStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedLesson, setSelectedLesson] = useState("");

    const handleNextStep = () => {
        if (step === 2 && !selectedFile) {
            toast.warning("Vui lòng tải lên file Excel trước");
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
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv') && !file.name.endsWith('.xls')) {
                toast.error("Vui lòng chọn đúng định dạng file (.xlsx, .xls, .csv)");
                return;
            }

            setSelectedFile(file);
            toast.success(`Đã chọn file: ${file.name}`);
        }
    };

    const handleUpload = async () => {
        // Validation
        if (!selectedFile) {
            toast.error("Vui lòng chọn file Excel hợp lệ");
            setStep(2);
            return;
        }
        if (!selectedLesson) {
            toast.error("Vui lòng chọn bài học đích");
            return;
        }

        setIsUploading(true);
        try {
            const response = await importFlashcards(selectedFile, selectedLesson);

            toast.success(response.message || "Import thành công!");
            onImportSuccess([]); // Trigger refresh
            onOpenChange(false);

            // Reset
            setStep(1);
            setSelectedFile(null);
            setSelectedLesson("");
        } catch (error: any) {
            const message = error.response?.data?.message || (error instanceof Error ? error.message : "Đã có lỗi xảy ra trong quá trình nhập dữ liệu");
            toast.error(message);
        } finally {
            setIsUploading(false);
        }
    };

    const stepItems = [
        { title: "Mẫu", completed: step > 1, active: step === 1 },
        { title: "Upload", completed: step > 2, active: step === 2 },
        { title: "Gán bài", completed: false, active: step === 3 },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="p-8 flex-1 overflow-y-auto">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl">
                                <FileSpreadsheet className="size-5 text-indigo-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                                    Import Flashcards
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium text-sm">
                                    Nhập dữ liệu nhanh từ file Excel.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Stepper Header Mini */}
                    <div className="flex items-center justify-between mb-8 px-2">
                        {stepItems.map((item, index) => (
                            <Fragment key={index}>
                                <div className="flex flex-col items-center gap-2 relative z-10">
                                    <div
                                        className={cn(
                                            "size-9 rounded-xl flex items-center justify-center font-black transition-all border-2 duration-300 text-xs",
                                            item.completed
                                                ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100"
                                                : item.active
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105"
                                                    : "bg-slate-50 border-slate-100 text-slate-400"
                                        )}
                                    >
                                        {item.completed ? <Check className="size-4 stroke-[3px]" /> : index + 1}
                                    </div>
                                    <span className={cn(
                                        "text-[9px] uppercase tracking-wider font-black",
                                        item.active ? "text-indigo-600" : "text-slate-400"
                                    )}>
                                        {item.title}
                                    </span>
                                </div>
                                {index < stepItems.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-2 bg-slate-100 rounded-full relative -top-3.5">
                                        <div
                                            className={cn(
                                                "h-full bg-indigo-500 transition-all duration-500",
                                                step > index + 1 ? "w-full" : "w-0"
                                            )}
                                        />
                                    </div>
                                )}
                            </Fragment>
                        ))}
                    </div>

                    <div className="min-h-[200px] flex flex-col justify-center">
                        {step === 1 && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
                                    <div className="size-14 bg-white rounded-xl shadow-sm mx-auto flex items-center justify-center border border-slate-100">
                                        <Download className="size-6 text-indigo-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-slate-900 text-lg">Tải File Mẫu</h3>
                                        <p className="text-slate-500 text-xs font-medium px-4">
                                            Sử dụng file mẫu để hệ thống nhận diện đúng các trường dữ liệu.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            downloadExcelTemplate();
                                            toast.success("Đã tải file mẫu thành công!");
                                        }}
                                        className="bg-white border-slate-200 hover:border-indigo-500 hover:text-indigo-600 font-bold h-11 px-6 rounded-xl gap-2 transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        <Download className="size-4" />
                                        Template.xlsx
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer",
                                        selectedFile
                                            ? "border-emerald-500 bg-emerald-50/20"
                                            : "border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/20"
                                    )}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (e.dataTransfer.files?.[0]) {
                                            const file = e.dataTransfer.files[0];
                                            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
                                                toast.error("Sai định dạng file");
                                                return;
                                            }
                                            setSelectedFile(file);
                                            toast.success(`Đã nhận file: ${file.name}`);
                                        }
                                    }}
                                >
                                    <div className={cn(
                                        "size-14 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                        selectedFile ? "bg-emerald-500 text-white" : "bg-white text-slate-400"
                                    )}>
                                        {selectedFile ? <Check className="size-7 stroke-[3px]" /> : <Upload className="size-7" />}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]">
                                            {selectedFile ? selectedFile.name : "Kéo thả file vào đây"}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">Hỗ trợ .xlsx, .csv (Tối đa 5MB)</p>
                                    </div>
                                    <label className="cursor-pointer">
                                        <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                                        <div className="text-indigo-600 font-black text-xs hover:underline mt-1">Duyệt file</div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                                    <Bookmark className="size-5 text-indigo-600" />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-black text-slate-900">Nơi lưu trữ</p>
                                        <p className="text-[10px] text-slate-500 font-bold">Chọn bài học để gán thẻ</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider pl-1">Chọn Bài Học *</Label>
                                    <select
                                        value={selectedLesson}
                                        onChange={(e) => setSelectedLesson(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl h-11 px-4 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm appearance-none"
                                    >
                                        <option value="">-- Chọn bài học đích --</option>
                                        <option value="n5-kanji">Bài 1: Kanji N5 cơ bản</option>
                                        <option value="n4-vocab">Bài 5: Từ vựng N4 Giao thông</option>
                                    </select>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl flex gap-2">
                                    <AlertCircle className="size-4 text-slate-400 shrink-0" />
                                    <p className="text-[10px] text-slate-500 font-medium">Hệ thống sẽ bỏ qua các thẻ trùng lặp hoặc lỗi định dạng.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-slate-50 mt-4">
                        {step > 1 && (
                            <Button
                                variant="ghost"
                                onClick={handlePrevStep}
                                disabled={isUploading}
                                className="flex-1 h-12 rounded-xl font-bold text-slate-500 transition-all hover:bg-slate-100"
                            >
                                <ArrowLeft className="size-4 mr-2" />
                                Quay Lại
                            </Button>
                        )}
                        {step < 3 ? (
                            <Button
                                onClick={handleNextStep}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 border-none"
                            >
                                Tiếp tục
                                <ArrowRight className="size-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading || !selectedLesson}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 border-none"
                            >
                                {isUploading ? <Loader2 className="size-5 animate-spin mx-auto" /> : "Xác nhận Nhập"}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
