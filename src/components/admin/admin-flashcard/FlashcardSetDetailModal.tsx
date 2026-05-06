"use client";

import React, { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
    Layers,
    Search,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Loader2
} from "lucide-react";
import { FlashcardSet, Flashcard } from "@/types/flashcard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteFlashcardDialog } from "./DeleteFlashcardDialog";
import { useDeleteFlashcardMutation } from "@/store/services/admin/flashcardApi";

interface FlashcardSetDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    set: FlashcardSet | null;
    cards: Flashcard[];
    onViewCard?: (card: Flashcard, index: number) => void;
    onEditCard?: (card: Flashcard) => void;
    onAddCard?: () => void;
    onRefresh?: () => void;
}

export const FlashcardSetDetailModal = ({
    open,
    onOpenChange,
    set,
    cards,
    onEditCard,
    onAddCard,
    onRefresh,
}: FlashcardSetDetailModalProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteCardTarget, setDeleteCardTarget] = useState<Flashcard | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [deleteCard, { isLoading: isDeletingCard }] = useDeleteFlashcardMutation();

    const filteredCards = cards.filter(card => {
        const matchSearch =
            (card.kanji?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (card.meaning?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (card.hiragana?.toLowerCase() || "").includes(searchQuery.toLowerCase());
        return matchSearch;
    });

    const stats = [
        { label: "Tổng số thẻ", value: cards.length, color: "text-muted-foreground" },
        { label: "Đã thuộc", value: cards.filter(c=>c.studyStatus==='learned').length, color: "text-emerald-600" },
        { label: "Cần ôn tập", value: cards.filter(c=>c.studyStatus==='review').length, color: "text-amber-600" },
    ];

    const handleRefresh = async () => {
        if (!onRefresh) return;
        setIsRefreshing(true);
        try {
            await onRefresh();
            await new Promise(r => setTimeout(r, 600));
            toast.success("Dữ liệu đã được cập nhật!");
        } catch (error) {
            toast.error("Lấy dữ liệu thất bại");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDeleteCard = async () => {
        if (!deleteCardTarget) return;
        try {
            await deleteCard(deleteCardTarget.id).unwrap();
            
            // Revalidate ISR pages
            fetch("/api/revalidate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "flashcard", action: "update" }),
            }).catch(() => {});
            
            toast.success("Xóa thẻ thành công!");
            setDeleteCardTarget(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Xóa thẻ thất bại");
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[1000px] h-[85vh] p-0 flex flex-col">
                    <DialogHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Layers className="size-5 text-muted-foreground" />
                                Danh sách thẻ: {set?.name}
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                                Hiển thị {filteredCards.length} / {cards.length} thẻ kiến thức bài {set?.lesson}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleRefresh} 
                                disabled={isRefreshing}
                                className="size-9 p-0"
                            >
                                <RefreshCw className={cn("size-4", isRefreshing && "animate-spin text-primary")} />
                            </Button>
                            <Button onClick={onAddCard} size="sm" className="gap-2 h-9 px-4 font-bold bg-slate-900 hover:bg-slate-800 transition-all shadow-sm">
                                <Plus className="size-4" /> Thêm thẻ mới
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* Quick Stats - Standardized Typography */}
                    <div className="px-6 py-4 bg-muted/20 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-8">
                            {stats.map(s => (
                                <div key={s.label} className="flex flex-col">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                                    <span className={cn("text-xl font-bold leading-tight mt-0.5", s.color)}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm từ vựng, hán tự, nghĩa..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 border-slate-200 focus:border-primary/50 transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
                        {filteredCards.length > 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="hover:bg-transparent border-b">
                                            <TableHead className="w-14 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">STT</TableHead>
                                            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Hán tự / Từ vựng</TableHead>
                                            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">Cách đọc</TableHead>
                                            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ý nghĩa (VN)</TableHead>
                                            <TableHead className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</TableHead>
                                            <TableHead className="text-right pr-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCards.map((card, idx) => (
                                            <TableRow key={card.id || idx} className="group hover:bg-slate-50/80 transition-colors border-b last:border-0">
                                                <TableCell className="text-center text-xs font-medium text-slate-400">{idx + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col py-1">
                                                        <span className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">{card.kanji}</span>
                                                        <span className="text-[10px] font-medium text-slate-400 mt-0.5 italic">{card.type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-medium bg-slate-100/80 text-slate-600 border-slate-200 text-xs px-2 py-0.5">
                                                        {card.hiragana}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-700 text-sm max-w-[200px] truncate">{card.meaning}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] font-bold px-2 py-0.5 border-none shadow-none leading-none",
                                                            card.studyStatus === 'learned' ? "bg-emerald-50 text-emerald-600" :
                                                            card.studyStatus === 'review' ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                                                        )}
                                                    >
                                                        {card.studyStatus === 'learned' ? "ĐÃ THUỘC" : card.studyStatus === 'review' ? "CẦN ÔN" : "MỚI HỌC"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                   <div className="flex items-center justify-end gap-1">
                                                       <Button 
                                                          size="icon" 
                                                          variant="ghost" 
                                                          onClick={() => onEditCard?.(card)} 
                                                          className="size-8 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-100"
                                                        >
                                                           <Edit className="size-3.5 text-muted-foreground" />
                                                       </Button>
                                                       <Button 
                                                          size="icon" 
                                                          variant="ghost" 
                                                          onClick={() => setDeleteCardTarget(card)} 
                                                          className="size-8 rounded-md opacity-0 group-hover:opacity-100 transition-all text-destructive hover:bg-destructive/10"
                                                        >
                                                           <Trash2 className="size-3.5" />
                                                       </Button>
                                                   </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-24 text-center flex flex-col items-center gap-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                <div className="p-4 rounded-full bg-slate-100">
                                    <Search className="size-8 text-slate-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-900">Không tìm thấy thẻ học nào</p>
                                    <p className="text-xs text-muted-foreground">Thử điều chỉnh từ khóa tìm kiếm.</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setSearchQuery("")} className="mt-2 text-xs font-bold border-slate-300">XÓA BỘ LỌC</Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 border-t bg-slate-50/30 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9 px-6 font-bold text-[11px] uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-all border-slate-300">ĐÓNG</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteFlashcardDialog
                open={deleteCardTarget !== null}
                onOpenChange={(open) => !open && setDeleteCardTarget(null)}
                title={deleteCardTarget?.kanji}
                isDeleting={isDeletingCard}
                onConfirm={handleDeleteCard}
                type="card"
            />
        </>
    );
};
