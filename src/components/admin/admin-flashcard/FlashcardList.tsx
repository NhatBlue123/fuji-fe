"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
    Plus,
    Download,
    Search,
    Filter,
    Edit,
    Trash2,
    Bookmark,
    Layers,
    Clock,
    CheckCircle2,
    AlertCircle,
    Check,
    Upload,
    Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CreateFlashcardModal } from "./CreateFlashcardModal";
import { ViewFlashcardModal } from "./ViewFlashcardModal";
import { Flashcard } from "@/types/flashcard";
import { exportFlashcardsToExcel } from "./flashcardUtils";
import { Card } from "@/types/card";

interface FlashcardListProps {
    cards: Flashcard[];
    onImportClick: () => void;
    onCreateClick: () => void;
    onUpdateCard: (updatedCard: Flashcard) => void;
    onDeleteCard: (id: number) => void;
}

export const FlashcardList = ({
    cards,
    onImportClick,
    onCreateClick,
    onUpdateCard,
    onDeleteCard,
}: FlashcardListProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [savedCards, setSavedCards] = useState<number[]>([]);
    const [selectedCards, setSelectedCards] = useState<number[]>([]);
    const [selectedExportCards, setSelectedExportCards] = useState<number[]>([]);

    const [isViewCardOpen, setIsViewCardOpen] = useState(false);
    const [viewCards, setViewCards] = useState<Card[]>([]);
    const [viewLevel, setViewLevel] = useState<string>("");

    // Edit/Delete/View state
    const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deletingCardId, setDeletingCardId] = useState<number | null>(null);
    const [viewingCard, setViewingCard] = useState<Flashcard | null>(null);
    const [showFilter, setShowFilter] = useState(false);

    const toggleSaveCard = (id: number) => {
        if (savedCards.includes(id)) {
            setSavedCards(savedCards.filter(cardId => cardId !== id));
            toast.info("Đã bỏ lưu thẻ");
        } else {
            setSavedCards([...savedCards, id]);
            toast.success("Đã lưu thẻ!");
        }
    };
    const toggleExportCard = (id: number) => {
        setSelectedExportCards(prev =>
            prev.includes(id)
                ? prev.filter(cardId => cardId !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAllExport = (cards: Flashcard[]) => {
        if (selectedExportCards.length === cards.length) {
            setSelectedExportCards([]);
        } else {
            setSelectedExportCards(cards.map(c => c.id));
        }
    };

    const handleEditClick = (card: Flashcard) => {
        setEditingCard(card);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setDeletingCardId(id);
    };

    const confirmDelete = () => {
        if (deletingCardId) {
            onDeleteCard(deletingCardId);
            toast.success("Đã xóa thẻ");
            setDeletingCardId(null);
        }
    };
    const toggleSelectCard = (id: number) => {
        setSelectedCards(prev =>
            prev.includes(id)
                ? prev.filter(cardId => cardId !== id)
                : [...prev, id]
        );
    };

    const filteredCards = useMemo(() => {
        return cards.filter(card => {
            const matchesSearch = card.kanji.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.meaning.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || card.studyStatus === statusFilter;
            const matchesType = typeFilter === "all" || card.type === typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [cards, searchQuery, statusFilter, typeFilter]);

    // Stats
    const stats = useMemo(() => {
        return [
            { label: "Tổng số", value: cards.length.toString(), icon: Layers, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Đã học", value: cards.filter(c => c.studyStatus === 'learned').length.toString(), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Chưa học", value: cards.filter(c => c.studyStatus === 'not_learned').length.toString(), icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Cần ôn", value: cards.filter(c => c.studyStatus === 'review').length.toString(), icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
        ];
    }, [cards]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Search + Filter Section */}
            <div className="space-y-4">

                {/* Row 1: Search + Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                    {/* Search Box */}
                    <div className="relative w-full max-w-xl group">

                        {/* Search Icon */}
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />

                        {/* Filter Button (inside input, right side) */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowFilter(prev => !prev)}
                            className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg transition-all",
                                showFilter
                                    ? "bg-indigo-100 text-indigo-600"
                                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            )}
                        >
                            <Filter className="size-4" />
                        </Button>

                        {/* Input */}
                        <Input
                            placeholder="Tìm kiếm từ vựng, ý nghĩa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-12 h-12 bg-white border border-slate-200 rounded-xl shadow-sm
                   focus-visible:ring-2 focus-visible:ring-indigo-500/20
                   focus-visible:border-indigo-500 transition-all"
                        />
                    </div>




                    <Button
                        onClick={onCreateClick}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12 px-6 rounded-xl shadow-md transition-all"
                    >
                        <Plus className="size-5 mr-2" />
                        Tạo Thẻ Mới
                    </Button>

                    <Button
                        variant="outline"
                        disabled={selectedCards.length === 0}
                        onClick={() => {
                            const exportCards = filteredCards.filter(card =>
                                selectedCards.includes(card.id)
                            );

                            exportFlashcardsToExcel(
                                exportCards,
                                `flashcards_selected_${new Date().toISOString().split("T")[0]}.xlsx`
                            );

                            toast.success(`Đã xuất ${exportCards.length} thẻ`);
                            setSelectedCards([]);
                        }}
                        className="h-12 px-6 rounded-xl font-semibold border-slate-200"
                    >
                        <Upload className="size-5 mr-2" />
                        Export Excel
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onImportClick}
                        className="h-12 px-6 rounded-xl font-semibold border-slate-200"
                    >
                        <Download className="size-5 mr-2" />
                        Import Excel
                    </Button>

                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilter && (
                <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                        {/* Status Filter */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                Trạng thái:
                            </p>

                            {[
                                { label: "Tất cả", value: "all" },
                                { label: "Đã học", value: "learned" },
                                { label: "Chưa học", value: "not_learned" },
                                { label: "Cần ôn", value: "review" },
                            ].map(item => (
                                <button
                                    key={item.value}
                                    onClick={() => setStatusFilter(item.value)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-xs font-semibold transition-all border",
                                        statusFilter === item.value
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Type Filter */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                Loại:
                            </p>

                            {[
                                { label: "Tất cả", value: "all" },
                                { label: "Kanji", value: "Kanji" },
                                { label: "Từ vựng", value: "Vocabulary" },
                            ].map(item => (
                                <button
                                    key={item.value}
                                    onClick={() => setTypeFilter(item.value)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-xs font-semibold transition-all border",
                                        typeFilter === item.value
                                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                    </div>
                </div>
            )}





            {/* Quick Stats Mini */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className={cn("p-2 rounded-lg", stat.bg)}>
                            <stat.icon className={cn("size-4", stat.color)} />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                            <div className="text-lg font-black text-slate-900">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (selectedCards.length === filteredCards.length) {
                            setSelectedCards([]);
                        } else {
                            setSelectedCards(filteredCards.map(c => c.id));
                        }
                    }}
                >
                    {selectedCards.length === filteredCards.length
                        ? "Bỏ chọn tất cả"
                        : "Chọn tất cả"}
                </Button>

                {selectedCards.length > 0 && (
                    <span className="text-sm font-bold text-indigo-600">
                        Đã chọn {selectedCards.length} thẻ
                    </span>
                )}
            </div>

            {/* Flashcard Grid - Reactive filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCards.length > 0 ? filteredCards.map((card) => (
                    <div
                        key={card.id}
                        className="group relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
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
                                onClick={() => toggleSaveCard(card.id)}
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
                        <div
                            className="text-center space-y-2 mb-6 cursor-pointer"
                            onClick={() => setViewingCard(card)}
                        >
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight hover:text-amber-600 transition-colors">
                                {card.kanji}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 bg-slate-50 inline-block px-3 py-1 rounded-lg">
                                {card.hiragana}
                            </p>
                            <div className="h-px w-8 bg-slate-100 mx-auto my-3" />
                            <p className="text-md font-bold text-amber-600 tracking-tight leading-tight">
                                {card.meaning}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium italic line-clamp-1 opacity-70">
                                "{card.example}"
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                    {card.lesson}
                                </span>
                                {card.studyStatus === 'learned' && <CheckCircle2 className="size-3 text-emerald-500" />}
                                {card.studyStatus === 'review' && <AlertCircle className="size-3 text-rose-500" />}
                                {/* View Count */}
                                <div className="flex items-center gap-1 ml-auto">
                                    <Eye className="size-3 text-indigo-400" />
                                    <span className="text-[9px] font-black text-indigo-600">
                                        {card.viewCount || 0}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSelectCard(card.id);
                                    }}
                                    className={cn(
                                        "size-8 rounded-lg transition-all",
                                        selectedCards.includes(card.id)
                                            ? "bg-indigo-100 text-indigo-600"
                                            : "text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                                    )}
                                >
                                    <Check className="size-4" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(card);
                                    }}
                                    className="size-8 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                                >
                                    <Edit className="size-4" />
                                </Button>


                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(card.id);
                                    }}
                                    variant="ghost" size="icon" className="size-8 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <div className="size-16 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center mb-4">
                            <Filter className="size-8 text-slate-200" />
                        </div>
                        <p className="text-slate-500 font-bold text-lg">Không tìm thấy thẻ nào</p>
                        <p className="text-slate-400 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                )}

                {/* Smaller Add Card */}
                <button
                    onClick={onCreateClick}
                    className="group bg-slate-50/50 rounded-2xl p-6 border-2 border-dashed border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all duration-300 flex flex-col items-center justify-center gap-3 min-h-[220px]"
                >
                    <div className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-amber-600 group-hover:scale-110 transition-all shadow-sm">
                        <Plus className="size-6 stroke-[3px]" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-slate-900 text-sm">Tạo thẻ mới</p>
                        <p className="text-[11px] text-slate-400 font-medium tracking-tight">Thêm nội dung bài học</p>
                    </div>
                </button>

            </div>

            {/* View Flashcard Modal */}
            <ViewFlashcardModal
                open={isViewCardOpen}
                onOpenChange={setIsViewCardOpen}
                cards={viewCards}
                flashCardLevel={viewLevel}
            />

            {/* Edit Modal */}
            <CreateFlashcardModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                editData={editingCard}
                onUpdateSuccess={onUpdateCard}
            />

            {/* Delete Confirmation Modal using Standard Dialog */}
            <Dialog open={deletingCardId !== null} onOpenChange={(open) => !open && setDeletingCardId(null)}>
                <DialogContent className="max-w-md rounded-2xl border border-slate-100 p-6 shadow-xl">

                    <div className="flex items-start gap-4">

                        {/* Icon */}
                        <div className="size-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                            <Trash2 className="size-5 text-rose-500" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                            <DialogTitle className="text-lg font-black text-slate-900">
                                Xóa thẻ này?
                            </DialogTitle>

                            <DialogDescription className="text-sm text-slate-500 font-medium leading-relaxed">
                                Thẻ sẽ bị xóa vĩnh viễn khỏi hệ thống và không thể khôi phục lại.
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setDeletingCardId(null)}
                            className="h-10 px-5 rounded-lg font-semibold text-slate-500 hover:bg-slate-100"
                        >
                            Hủy
                        </Button>

                        <Button
                            onClick={confirmDelete}
                            className="h-10 px-5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-sm"
                        >
                            Xóa
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>

        </div>
    );
};
