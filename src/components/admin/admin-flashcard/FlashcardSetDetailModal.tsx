"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Layers,
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    X,
    Filter,
    Download,
    CheckCircle2,
    Clock,
    AlertCircle,
    Bookmark,
    Upload,
} from "lucide-react";
import { FlashcardSet, Flashcard } from "@/types/flashcard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportFlashcardsToExcel } from "./flashcardUtils";
import { ImportFlashcardModal } from "./ImportFlashcardModal";
interface FlashcardSetDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    set: FlashcardSet | null;
    cards: Flashcard[];
    onViewCard?: (card: Flashcard, index: number) => void;
    onEditCard?: (card: Flashcard) => void;
    onDeleteCard?: (id: number) => void;
    onAddCard?: () => void;
    onImportClick?: () => void;
}

export const FlashcardSetDetailModal = ({
    open,
    onOpenChange,
    set,
    cards,
    onViewCard,
    onEditCard,
    onDeleteCard,
    onAddCard,
    onImportClick,
}: FlashcardSetDetailModalProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [savedCards, setSavedCards] = useState<number[]>([]);
    const [openImport, setOpenImport] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"all" | "learned" | "not_learned" | "review">("all");

    if (!set) return null;

    const filteredCards = cards.filter(card => {
        const matchSearch =
            card.kanji.toLowerCase().includes(searchQuery.toLowerCase()) ||
            card.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
            card.hiragana.toLowerCase().includes(searchQuery.toLowerCase());

        const matchStatus =
            statusFilter === "all" ? true : card.studyStatus === statusFilter;

        return matchSearch && matchStatus;
    });

    const totalViews = cards.reduce(
        (sum, card) => sum + (card.viewCount ?? 0),
        0
    );

    const toggleSaveCard = (id: number) => {
        if (savedCards.includes(id)) {
            setSavedCards(savedCards.filter(cardId => cardId !== id));
            toast.info("Đã bỏ lưu thẻ");
        } else {
            setSavedCards([...savedCards, id]);
            toast.success("Đã lưu thẻ!");
        }
    };

    const stats = [
        {
            label: "Tổng số",
            value: cards.length,
            icon: Layers,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
        },
        {
            label: "Đã học",
            value: cards.filter(c => c.studyStatus === 'learned').length,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            label: "Chưa học",
            value: cards.filter(c => c.studyStatus === 'not_learned').length,
            icon: Clock,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
        {
            label: "Cần ôn",
            value: cards.filter(c => c.studyStatus === 'review').length,
            icon: AlertCircle,
            color: "text-rose-600",
            bg: "bg-rose-50",
        },
        {
            label: "Tổng lượt xem",
            value: totalViews,
            icon: Eye,
            color: "text-sky-600",
            bg: "bg-sky-50",
        },
    ];



    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                    {/* Header Section */}
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Layers className="size-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight mb-1">{set.name}</h2>
                                <p className="text-indigo-100 font-bold text-sm opacity-90">{set.lesson}</p>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-5 gap-4">
                            {stats.map((stat, i) => (
                                <div key={i} className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                            <stat.icon className="size-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-200">{stat.label}</p>
                                            <p className="text-2xl font-black">{stat.value}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Search & Actions Bar */}
                    <div className="px-8 py-4 border-b border-slate-100 bg-white">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                            {/* Search Box */}
                            <div className="relative w-full max-w-xl group">

                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />

                                <Input
                                    placeholder="Tìm kiếm từ vựng trong bộ này..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 h-12 bg-white border border-slate-200 rounded-xl shadow-sm
                       focus-visible:ring-2 focus-visible:ring-indigo-500/20
                       focus-visible:border-indigo-500 transition-all"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">

                                <Button
                                    onClick={onAddCard}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12 px-6 rounded-xl shadow-md transition-all"
                                >
                                    <Plus className="size-4 mr-2" />
                                    Thêm Thẻ
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        exportFlashcardsToExcel(
                                            cards,
                                            `flashcards_${new Date().toISOString().split('T')[0]}.xlsx`
                                        );
                                        toast.success("Đã xuất file Excel thành công!");
                                    }}
                                    className="h-12 px-6 rounded-xl font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    <Upload className="size-4 mr-2" />
                                    Export Excel
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => setOpenImport(true)}
                                    className="h-12 px-6 rounded-xl font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    <Download className="size-4 mr-2" />
                                    Import Excel
                                </Button>

                            </div>

                        </div>

                    </div>

                    {/* Cards Grid - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50/30">
                        {filteredCards.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredCards.map((card, index) => (
                                    <div
                                        key={card.id}
                                        className="group relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                        onClick={() => onViewCard?.(card, index)}
                                    >
                                        {/* Header Mini */}
                                        <div className="flex justify-between items-start mb-4">
                                            <Badge variant="secondary" className={cn(
                                                "px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider border-none",
                                                card.type === "Kanji" ? "bg-orange-50 text-orange-600" : "bg-amber-50 text-amber-600"
                                            )}>
                                                {card.type}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSaveCard(card.id);
                                                }}
                                                className={cn(
                                                    "size-8 rounded-lg transition-all",
                                                    savedCards.includes(card.id)
                                                        ? "bg-amber-100 text-amber-600 scale-110 shadow-sm"
                                                        : "text-slate-300 hover:text-amber-600 hover:bg-amber-50"
                                                )}
                                            >
                                                <Bookmark className={cn("size-4", savedCards.includes(card.id) ? "fill-current" : "")} />
                                            </Button>
                                        </div>

                                        {/* Content Area */}
                                        <div className="text-center space-y-2 mb-6">
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight hover:text-indigo-600 transition-colors">
                                                {card.kanji}
                                            </h3>
                                            <p className="text-xs font-bold text-slate-400 bg-slate-50 inline-block px-3 py-1 rounded-lg">
                                                {card.hiragana}
                                            </p>
                                            <div className="h-px w-8 bg-slate-100 mx-auto my-3" />
                                            <p className="text-md font-bold text-indigo-600 tracking-tight leading-tight">
                                                {card.meaning}
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-medium italic line-clamp-1 opacity-70">
                                                "{card.example}"
                                            </p>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                                            <div className="flex items-center gap-2">
                                                {card.studyStatus === 'learned' && <CheckCircle2 className="size-3 text-emerald-500" />}
                                                {card.studyStatus === 'review' && <AlertCircle className="size-3 text-rose-500" />}
                                                {card.studyStatus === 'not_learned' && <Clock className="size-3 text-slate-300" />}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditCard?.(card);
                                                    }}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                                                >
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteCard?.(card.id);
                                                    }}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                                <div className="size-16 bg-slate-50 rounded-2xl shadow-sm mx-auto flex items-center justify-center mb-4">
                                    <Search className="size-8 text-slate-200" />
                                </div>
                                <p className="text-slate-500 font-bold text-lg">Chưa có thẻ nào trong bộ này</p>
                                <p className="text-slate-400 text-sm mb-6">Hãy thêm thẻ mới hoặc import từ Excel</p>
                                <Button
                                    onClick={onAddCard}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-6 rounded-xl gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                    <Plus className="size-5 stroke-[3px]" />
                                    Thêm Thẻ Đầu Tiên
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <ImportFlashcardModal
                open={openImport}
                onOpenChange={setOpenImport}
                onImportSuccess={(data) => {
                    console.log("Imported cards:", data);
                    toast.success(`Đã import ${data.length} thẻ`);
                }}
            />
        </>
    );
};
