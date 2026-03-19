"use client";

import React, { useState, useMemo } from "react";
import { FlashcardHeader } from "@/components/admin/admin-flashcard/FlashcardHeader";
import { CreateFlashcardSetModal } from "@/components/admin/admin-flashcard/CreateFlashcardSetModal";
import { ImportFlashcardModal } from "@/components/admin/admin-flashcard/ImportFlashcardModal";
import { FlashcardSetDetailModal } from "@/components/admin/admin-flashcard/FlashcardSetDetailModal";
import { CreateFlashcardModal } from "@/components/admin/admin-flashcard/CreateFlashcardModal";
import { DeleteFlashcardDialog } from "@/components/admin/admin-flashcard/DeleteFlashcardDialog";
import { 
  useGetFlashcardsQuery, 
  useDeleteFlashcardSetMutation 
} from "@/store/services/admin/flashcardApi";
import {
  Loader2,
  Layers,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FlashcardSet, Flashcard } from "@/types/flashcard";
import { exportFlashcardsToExcel } from "@/components/admin/admin-flashcard/flashcardUtils";
import { cn } from "@/lib/utils";

export default function FlashcardPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Detail Modal States
  const [viewingSet, setViewingSet] = useState<FlashcardSet | null>(null);
  const [editingSet, setEditingSet] = useState<FlashcardSet | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [createCardModalOpen, setCreateCardModalOpen] = useState(false);

  // Delete Dialog States
  const [deleteSetTarget, setDeleteSetTarget] = useState<FlashcardSet | null>(null);

  const { data: apiFlashcards, isLoading, isError, refetch } = useGetFlashcardsQuery();
  const [deleteSet, { isLoading: isDeletingSet }] = useDeleteFlashcardSetMutation();

  // Group cards into virtual sets by lesson
  const sets = useMemo(() => {
    if (!apiFlashcards) return [];
    const setsMap = new Map<string, FlashcardSet>();

    apiFlashcards.forEach((card, index) => {
      const lesson = card.lesson || "Chưa phân loại";
      if (!setsMap.has(lesson)) {
        setsMap.set(lesson, {
          id: index + 1,
          name: lesson,
          lesson: lesson,
          description: `Tập hợp các thẻ thuộc bài ${lesson}`,
          numCards: 0,
          createdAt: new Date().toISOString(),
          status: "Active",
          isPublic: true
        });
      }
      const set = setsMap.get(lesson)!;
      set.numCards += 1;
    });

    return Array.from(setsMap.values());
  }, [apiFlashcards]);

  const filteredSets = useMemo(() => {
    return sets.filter(
      (set) =>
        set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.lesson.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sets, searchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
     if (!apiFlashcards) return { totalSets: 0, totalCards: 0, learned: 0 };
     return {
         totalSets: sets.length,
         totalCards: apiFlashcards.length,
         learned: apiFlashcards.filter(c => c.studyStatus === 'learned').length
     };
  }, [apiFlashcards, sets]);

  const handleDeleteSet = async () => {
    if (!deleteSetTarget) return;
    try {
        await deleteSet(deleteSetTarget.id).unwrap();
        toast.success("Xóa bộ thẻ thành công!");
        setDeleteSetTarget(null);
        refetch();
    } catch (error: any) {
        toast.error(error.data?.message || "Xóa bộ thẻ thất bại");
    }
  };

  return (
    <div className="space-y-6">
      <FlashcardHeader
        onCreateSet={() => setCreateModalOpen(true)}
        onImportExcel={() => setImportModalOpen(true)}
        totalSets={stats.totalSets}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">Tổng bộ thẻ</CardDescription>
            <Layers className="size-4" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-bold tracking-tight">{stats.totalSets}</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-1">Phân bố theo bài học</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">Tổng số thẻ</CardDescription>
            <BookOpen className="size-4" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-bold tracking-tight">{stats.totalCards}</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-1">{stats.learned} thẻ đã thuộc</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bộ thẻ hoặc bài học..."
            className="pl-9 h-10 border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Hiển thị <span className="text-slate-900">{filteredSets.length}</span> / {sets.length} bài học
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="size-8 text-primary animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách bộ thẻ...</p>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <p className="font-semibold mb-1">Không thể tải dữ liệu</p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2 mt-4 font-bold">
            <RefreshCw className="size-4" /> Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-lg font-bold">Danh sách bài học Flashcard</CardTitle>
            <CardDescription className="text-xs">Quản lý các bộ thẻ học theo từng cấp độ và bài học.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredSets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[250px] pl-6 font-semibold h-11 text-muted-foreground">Tên bộ thẻ / Mô tả</TableHead>
                      <TableHead className="font-semibold h-11 text-muted-foreground">Bài học</TableHead>
                      <TableHead className="text-center font-semibold h-11 text-muted-foreground">Số lượng thẻ</TableHead>
                      <TableHead className="text-center font-semibold h-11 text-muted-foreground">Trạng thái</TableHead>
                      <TableHead className="text-right pr-6 font-semibold h-11 text-muted-foreground">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSets.map((set) => (
                      <TableRow key={set.id} className="group transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-start gap-3 py-1">
                            <div className="p-2 bg-muted rounded-lg shrink-0 group-hover:bg-primary/10 transition-colors">
                              <Layers className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold tracking-tight truncate text-slate-900">{set.name}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 italic">{set.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-bold rounded-md px-2 py-0.5 text-[10px] bg-slate-100/80 border-slate-200">
                            {set.lesson}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                           <span className="font-bold text-sm">{set.numCards}</span>
                           <span className="text-[10px] text-muted-foreground ml-1">thẻ</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={set.isPublic !== false ? "default" : "secondary"}
                            className={cn(
                                "text-[10px] font-bold px-2.5 py-0.5 h-6",
                                set.isPublic !== false ? "" : "bg-slate-200 text-slate-600"
                            )}
                          >
                            {set.isPublic !== false ? "Đã xuất bản" : "Bản nháp"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                             <Button variant="outline" size="sm" className="h-8 gap-1.5 pl-2.5 font-bold text-xs border-slate-200 hover:border-primary/30 transition-all shadow-sm" onClick={() => setViewingSet(set)}>
                                <Eye className="size-3.5" /> Chi tiết
                             </Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full focus-visible:ring-0">
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                    <DropdownMenuItem onClick={() => setEditingSet(set)} className="font-medium">
                                        <Edit className="mr-2 size-4" /> Sửa thông tin
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="font-medium"
                                      onClick={() => {
                                        exportFlashcardsToExcel(
                                            apiFlashcards?.filter(c => c.lesson === set.lesson) || [],
                                            `${set.lesson}.xlsx`
                                        );
                                      }}
                                    >
                                        <FileSpreadsheet className="mr-2 size-4" /> Xuất Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive font-bold" onClick={() => setDeleteSetTarget(set)}>
                                        <Trash2 className="mr-2 size-4 text-destructive" /> Xóa bộ thẻ
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                 <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                     <Search className="size-6 text-muted-foreground" />
                 </div>
                 <p className="text-slate-900 font-bold mb-1">Không tìm thấy kết quả</p>
                 <p className="text-muted-foreground text-xs font-medium">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals & Dialogs */}
      <CreateFlashcardSetModal
        open={createModalOpen || editingSet !== null}
        onOpenChange={(open) => {
            if (!open) setEditingSet(null);
            setCreateModalOpen(open);
        }}
        editData={editingSet}
        onSuccess={refetch}
      />

      <ImportFlashcardModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportSuccess={refetch}
      />

      <FlashcardSetDetailModal
        open={viewingSet !== null}
        onOpenChange={(open) => !open && setViewingSet(null)}
        set={viewingSet}
        cards={apiFlashcards?.filter(c => c.lesson === viewingSet?.lesson) || []}
        onEditCard={(card) => setEditingCard(card)}
        onAddCard={() => setCreateCardModalOpen(true)}
        onRefresh={refetch}
      />

      <CreateFlashcardModal
        open={createCardModalOpen || editingCard !== null}
        onOpenChange={(open) => {
            if (!open) setEditingCard(null);
            setCreateCardModalOpen(open);
        }}
        editData={editingCard}
        onCreateSuccess={refetch}
        onUpdateSuccess={refetch}
      />

      <DeleteFlashcardDialog
        open={deleteSetTarget !== null}
        onOpenChange={(open) => !open && setDeleteSetTarget(null)}
        title={deleteSetTarget?.name}
        isDeleting={isDeletingSet}
        onConfirm={handleDeleteSet}
        type="set"
      />
    </div>
  );
}
