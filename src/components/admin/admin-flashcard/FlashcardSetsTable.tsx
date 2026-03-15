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
  onCreateClick?: () => void;
  onImportClick?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
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
  canEdit = true,
  canDelete = true,
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
    setSets(sets.map((s) => (s.id === updatedSet.id ? updatedSet : s)));
  };

  const confirmDelete = () => {
    if (deletingSetId) {
      setSets(sets.filter((s) => s.id !== deletingSetId));
      toast.success("Đã xóa bộ chứa thẻ thành công");
      setDeletingSetId(null);
    }
  };

  const filteredSets = useMemo(() => {
    return sets.filter(
      (set) =>
        set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.lesson.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [sets, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="relative w-full max-w-xl group space-y-5">
          {/* Search Row */}
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowFilter((prev) => !prev)}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg transition-all",
                filterBy !== "all"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Filter className="size-4" />
            </Button>

            <Input
              placeholder="Tìm kiếm bộ thẻ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 h-10"
            />
          </div>

          {/* Filter Panel */}
          {showFilter && (
            <div
              className="bg-muted/50 border border-border rounded-xl px-4 py-3
        animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
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
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-foreground border-border hover:bg-accent",
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
          {onCreateClick && (
            <Button onClick={onCreateClick} className="h-10 px-5">
              <Plus className="size-4 mr-2" />
              Tạo Bộ Mới
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setIsExportOpen(true)}
            className="h-10 px-5"
          >
            <Upload className="size-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-12 pl-6">Tên Bộ Chứa</TableHead>
                <TableHead className="h-12">Khóa Học</TableHead>
                <TableHead className="h-12">Mô Tả</TableHead>
                <TableHead className="h-12 text-center">Số Thẻ</TableHead>
                <TableHead className="h-12">Ngày Tạo</TableHead>
                <TableHead className="h-12 text-right pr-6">
                  Hành Động
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSets.length > 0 ? (
                filteredSets.map((set) => (
                  <TableRow key={set.id} className="group">
                    <TableCell
                      className="py-4 pl-6"
                      onClick={() => setViewingSet(set)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Layers className="size-4 text-primary" />
                        </div>
                        <span className="font-semibold cursor-pointer hover:text-primary transition-colors">
                          {set.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => setViewingSet(set)}>
                      <Badge variant="outline">{set.lesson}</Badge>
                    </TableCell>
                    <TableCell
                      className="max-w-[250px] truncate text-muted-foreground text-sm"
                      onClick={() => setViewingSet(set)}
                    >
                      {set.description}
                    </TableCell>
                    <TableCell
                      className="text-center"
                      onClick={() => setViewingSet(set)}
                    >
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 h-7 rounded-md bg-primary/10 text-primary font-bold text-xs">
                        {set.numCards}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-sm"
                      onClick={() => setViewingSet(set)}
                    >
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
                            className="size-8"
                          >
                            <MoreHorizontal className="size-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-widest">
                            Quản lý bộ thẻ
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setViewingSet(set)}
                            className="cursor-pointer"
                          >
                            <Eye className="size-4 mr-2" /> Xem chi tiết
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => setEditingSet(set)}
                              className="cursor-pointer"
                            >
                              <Edit className="size-4 mr-2" /> Chỉnh sửa
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingSetId(set.id)}
                                className="text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-4 mr-2" /> Xóa bộ thẻ
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-4 bg-muted rounded-2xl">
                        <Search className="size-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        Không tìm thấy bộ chứa nào phù hợp.
                      </p>
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
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Xuất Excel</DialogTitle>
            <DialogDescription>
              Chọn bộ chứa thẻ bạn muốn xuất
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <button
              onClick={() => setExportSet(null)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border font-medium transition-all",
                exportSet === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent",
              )}
            >
              Xuất tất cả bộ thẻ
            </button>

            {sets.map((set) => (
              <button
                key={set.id}
                onClick={() => setExportSet(set)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg border font-medium transition-all",
                  exportSet?.id === set.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-accent",
                )}
              >
                {set.name}
              </button>
            ))}
          </div>

          <DialogFooter className="mt-2">
            <Button
              disabled={exportSet === undefined}
              onClick={() => {
                let dataToExport = MOCK_CARDS;
                let fileName = "tat-ca-bo-the.xlsx";

                if (exportSet) {
                  dataToExport = MOCK_CARDS;
                  fileName = `${exportSet.name}.xlsx`;
                }

                exportFlashcardsToExcel(dataToExport, fileName);

                toast.success(
                  exportSet
                    ? `Đã xuất bộ "${exportSet.name}"`
                    : "Đã xuất tất cả bộ thẻ",
                );

                setIsExportOpen(false);
                setExportSet(null);
              }}
            >
              Xuất Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
