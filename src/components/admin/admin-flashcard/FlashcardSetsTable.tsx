"use client";

import React, { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Download,
    Search,
    MoreHorizontal,
    Calendar,
    Layers,
    Filter,
    Eye,
    Edit,
    Trash2,
    Check,
    ChevronRight,
    Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { FlashcardSet, Flashcard } from "@/types/flashcard";
import { CreateFlashcardSetModal } from "./CreateFlashcardSetModal";
import { FlashcardSetDetailModal } from "./FlashcardSetDetailModal";
import { ViewFlashcardModal } from "./ViewFlashcardModal";
import { CreateFlashcardModal } from "./CreateFlashcardModal";
import { exportFlashcardsToExcel } from "./flashcardUtils";
import { Card } from "@/types/card";

interface FlashcardSetsTableProps {
    onCreateClick: () => void;
    onImportClick: () => void;
}

const INITIAL_SETS: FlashcardSet[] = [
    {
        id: 1,
        name: "N4 Kanji Part 1",
        lesson: "Khóa N4",
        description: "Tập hợp các ký tự Kanji N4 thông dụng nhất bài 1-10",
        numCards: 25,
        createdAt: "10/02/2024",
        status: "Active",
        lessonColor: "blue",
    },
    {
        id: 2,
        name: "N5 Vocabulary Core",
        lesson: "Khóa N5",
        description: "100 từ vựng cốt lõi cho người mới bắt đầu",
        numCards: 100,
        createdAt: "07/02/2024",
        status: "Draft",
        lessonColor: "indigo",
    },
];


// Mock cards data for demonstration
const MOCK_CARDS: Flashcard[] = [
    {
        id: 1,
        kanji: "食べる",
        hiragana: "たべる",
        meaning: "Ăn",
        example: "朝ごはんを食べます。",
        lesson: "N5 - Unit 1",
        type: "Vocabulary",
        studyStatus: "learned",
        viewCount: 0,
    },
    {
        id: 2,
        kanji: "飲む",
        hiragana: "のむ",
        meaning: "Uống",
        example: "水を飲みます。",
        lesson: "N5 - Unit 1",
        type: "Vocabulary",
        studyStatus: "learned",
        viewCount: 0,
    },
    {
        id: 3,
        kanji: "見る",
        hiragana: "みる",
        meaning: "Nhìn, xem",
        example: "テレビを見ます。",
        lesson: "N5 - Unit 1",
        type: "Vocabulary",
        studyStatus: "review",
        viewCount: 0,
    },
];

export const FlashcardSetsTable = ({
    onCreateClick,
}: FlashcardSetsTableProps) => {
    const [sets, setSets] = useState<FlashcardSet[]>(INITIAL_SETS);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterBy, setFilterBy] = useState("all");
    const [showFilter, setShowFilter] = useState(false);

    // Moved from global scope
    const [isViewCardOpen, setIsViewCardOpen] = useState(false);
    const [viewCards, setViewCards] = useState<Card[]>([]);
    const [viewLevel, setViewLevel] = useState<string>("");

    // Modal & Selection States
    const [viewingSet, setViewingSet] = useState<FlashcardSet | null>(null);
    const [editingSet, setEditingSet] = useState<FlashcardSet | null>(null);
    const [deletingSetId, setDeletingSetId] = useState<number | null>(null);
    const [viewingCard, setViewingCard] = useState<Flashcard | null>(null);
    const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
    const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false);

    const [isExportOpen, setIsExportOpen] = useState(false);
    const [exportSet, setExportSet] = useState<FlashcardSet | null>(null);
    const handleUpdateSet = (updatedSet: FlashcardSet) => {
        setSets(sets.map(s => s.id === updatedSet.id ? updatedSet : s));
    };

    const confirmDelete = () => {
        if (deletingSetId) {
            setSets(sets.filter(s => s.id !== deletingSetId));
            toast.success("Đã xóa bộ chứa thẻ thành công");
            setDeletingSetId(null);
        }
    };

    const filteredSets = useMemo(() => {
        return sets.filter(set =>
            set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            set.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            set.lesson.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [sets, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="relative w-full max-w-xl group space-y-5">


                    {/* Search Row */}
                    <div className="relative w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowFilter(prev => !prev)}
                            className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg transition-all",
                                filterBy !== "all"
                                    ? "bg-indigo-100 text-indigo-600"
                                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            )}
                        >
                            <Filter className="size-4" />
                        </Button>

                        <Input
                            placeholder="Tìm kiếm bộ thẻ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-12 h-12 bg-white border border-slate-200 rounded-xl shadow-sm
            focus-visible:ring-2 focus-visible:ring-indigo-500/20
            focus-visible:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Filter Panel */}
                    {showFilter && (
                        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm
        animate-in fade-in slide-in-from-top-2 duration-200">

                            <div className="flex items-center gap-4 flex-wrap">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                    Lọc bộ thẻ:
                                </p>

                                {[
                                    { label: "Tất cả", value: "all" },
                                    { label: "Mới nhất", value: "newest" },
                                    { label: "Theo khóa học", value: "course" },
                                ].map((item) => (
                                    <button
                                        key={item.value}
                                        onClick={() => setFilterBy(item.value)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-xs font-semibold transition-all border",
                                            filterBy === item.value
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}



                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={onCreateClick}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12 px-6 rounded-xl shadow-md transition-all"
                    >
                        <Plus className="size-5 mr-2" />
                        Tạo Bộ Mới
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setIsExportOpen(true)}
                        className="h-12 px-6 rounded-xl font-semibold border-slate-200"

                    >
                        <Upload className="size-5 mr-2" />
                        Export Excel
                    </Button>

                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="font-bold text-slate-500 h-14 pl-6">Tên Bộ Chứa</TableHead>
                                <TableHead className="font-bold text-slate-500 h-14">Khóa Học</TableHead>
                                <TableHead className="font-bold text-slate-500 h-14">Mô Tả</TableHead>
                                <TableHead className="font-bold text-slate-500 h-14 text-center">Số Thẻ</TableHead>
                                <TableHead className="font-bold text-slate-500 h-14">Ngày Tạo</TableHead>
                                <TableHead className="font-bold text-slate-500 h-14 text-right pr-6">Hành Động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSets.length > 0 ? filteredSets.map((set) => (
                                <TableRow
                                    key={set.id}
                                    className="hover:bg-slate-50/50 transition-colors border-slate-100 group"
                                >
                                    <TableCell className="py-4 pl-6" onClick={() => setViewingSet(set)}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                                <Layers className="size-4 text-indigo-600" />
                                            </div>
                                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer">{set.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell onClick={() => setViewingSet(set)}>
                                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-bold px-3 py-1 rounded-lg">
                                            {set.lesson}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[250px] truncate text-slate-500 font-medium text-sm" onClick={() => setViewingSet(set)}>
                                        {set.description}
                                    </TableCell>
                                    <TableCell className="text-center" onClick={() => setViewingSet(set)}>
                                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xs">
                                            {set.numCards}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-400 font-medium text-sm" onClick={() => setViewingSet(set)}>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-4 opacity-50" />
                                            {set.createdAt}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                                                >
                                                    <MoreHorizontal className="size-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 shadow-xl border-slate-100">
                                                <DropdownMenuLabel className="font-black text-xs text-slate-400 uppercase tracking-widest px-2 py-1.5">Quản lý bộ thẻ</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setViewingSet(set)} className="rounded-lg font-bold text-slate-600 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer flex items-center gap-2">
                                                    <Eye className="size-4" /> Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditingSet(set)} className="rounded-lg font-bold text-slate-600 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer flex items-center gap-2">
                                                    <Edit className="size-4" /> Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-slate-100" />
                                                <DropdownMenuItem onClick={() => setDeletingSetId(set.id)} className="rounded-lg font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-600 cursor-pointer flex items-center gap-2">
                                                    <Trash2 className="size-4" /> Xóa bộ thẻ
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <Search className="size-8 text-slate-200" />
                                            </div>
                                            <p className="text-slate-400 font-bold">Không tìm thấy bộ chứa nào phù hợp.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>


            {/* Set Detail Modal - Shows all cards in the set */}
            <FlashcardSetDetailModal
                open={viewingSet !== null}
                onOpenChange={(open) => !open && setViewingSet(null)}
                set={viewingSet}
                cards={MOCK_CARDS}
                onViewCard={(card, index) => {
                    setViewingCard(card);
                }}
                onEditCard={(card) => {
                    setEditingCard(card);
                }}
                onDeleteCard={(id) => {
                    toast.success("Đã xóa thẻ khỏi bộ chứa");
                }}
                onAddCard={() => {
                    setIsCreateCardModalOpen(true);
                }}
            />

            {/* View Individual Card Modal */}
            <ViewFlashcardModal
                open={isViewCardOpen}
                onOpenChange={setIsViewCardOpen}
                cards={viewCards}
                flashCardLevel={viewLevel}
            />

            {/* Edit Set Modal */}
            <CreateFlashcardSetModal
                open={editingSet !== null}
                onOpenChange={(open) => !open && setEditingSet(null)}
                editData={editingSet}
                onUpdateSuccess={handleUpdateSet}
            />

            {/* Edit Card Modal */}
            <CreateFlashcardModal
                open={editingCard !== null}
                onOpenChange={(open) => !open && setEditingCard(null)}
                editData={editingCard}
                onUpdateSuccess={(updatedCard) => {
                    toast.success("Đã cập nhật thẻ");
                    setEditingCard(null);
                }}
            />

            {/* Create Card Modal */}
            <CreateFlashcardModal
                open={isCreateCardModalOpen}
                onOpenChange={setIsCreateCardModalOpen}
                onCreateSuccess={(newCard) => {
                    toast.success("Đã thêm thẻ mới vào bộ chứa");
                    setIsCreateCardModalOpen(false);
                }}
            />

            {/* Delete Confirmation Modal */}
            <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                            Xuất Excel
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Chọn bộ chứa thẻ bạn muốn xuất
                        </DialogDescription>
                    </DialogHeader>

                    {/* Select Set */}
                    {/* Select Set */}
                    <div className="space-y-2">

                        {/* Export All Option */}
                        <button
                            onClick={() => setExportSet(null)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl border font-bold transition-all",
                                exportSet === null
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                                    : "border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            Xuất tất cả bộ thẻ
                        </button>

                        {sets.map((set) => (
                            <button
                                key={set.id}
                                onClick={() => setExportSet(set)}
                                className={cn(
                                    "w-full text-left px-4 py-3 rounded-xl border font-bold transition-all",
                                    exportSet?.id === set.id
                                        ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                                        : "border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                {set.name}
                            </button>
                        ))}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            disabled={exportSet === undefined}
                            onClick={() => {
                                // ⚠️ demo: MOCK_CARDS – sau này thay bằng API theo set.id
                                let dataToExport = MOCK_CARDS;
                                let fileName = "tat-ca-bo-the.xlsx";

                                if (exportSet) {
                                    dataToExport = MOCK_CARDS; // sau này lọc theo set.id
                                    fileName = `${exportSet.name}.xlsx`;
                                }

                                exportFlashcardsToExcel(dataToExport, fileName);

                                toast.success(
                                    exportSet
                                        ? `Đã xuất bộ "${exportSet.name}"`
                                        : "Đã xuất tất cả bộ thẻ"
                                );

                                setIsExportOpen(false);
                                setExportSet(null);
                            }}

                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl"
                        >
                            Xuất Excel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};
