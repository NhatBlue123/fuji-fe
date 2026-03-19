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
  Search,
  MoreHorizontal,
  Layers,
  Eye,
  Edit,
  Trash2,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  RefreshCw,
  BookOpen,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FlashcardSet, Flashcard } from "@/types/flashcard";
import { CreateFlashcardSetModal } from "./CreateFlashcardSetModal";
import { FlashcardSetDetailModal } from "./FlashcardSetDetailModal";
import { CreateFlashcardModal } from "./CreateFlashcardModal";
import { exportFlashcardsToExcel } from "./flashcardUtils";
import { 
  useGetFlashcardsQuery, 
  useDeleteFlashcardSetMutation 
} from "@/store/services/admin/flashcardApi";

export const FlashcardSetsTable = () => {
  const { data: apiFlashcards, isLoading, isError, refetch } = useGetFlashcardsQuery();
  const [deleteSet, { isLoading: isDeleting }] = useDeleteFlashcardSetMutation();

  // Navigation & UI States
  const [searchQuery, setSearchQuery] = useState("");

  // Modal & Selection States
  const [viewingSet, setViewingSet] = useState<FlashcardSet | null>(null);
  const [editingSet, setEditingSet] = useState<FlashcardSet | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false);
  const [isCreateSetModalOpen, setIsCreateSetModalOpen] = useState(false);

  // Group cards into virtual sets by lesson for management
  const sets = useMemo(() => {
    if (!apiFlashcards) return [];
    const setsMap = new Map<string, FlashcardSet>();

    apiFlashcards.forEach((card, index) => {
      const lesson = card.lesson || "Chưa phân loại";
      if (!setsMap.has(lesson)) {
        setsMap.set(lesson, {
          id: index + 1, // Visual ID for the set object
          name: lesson,
          lesson: lesson,
          description: `Tập hợp các thẻ thuộc bài ${lesson}`,
          numCards: 0,
          createdAt: "Auto",
          status: "Active",
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
        set.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sets, searchQuery]);

  const handleDeleteSet = async (lesson: string) => {
    if (confirm(`Bạn có chắc muốn xóa bài học "${lesson}"? Thao tác này sẽ xóa tất cả thẻ liên quan.`)) {
      try {
        // Since backend might delete by lesson string or ID 
        // We simulate with toast for now if mutation signature differs
        toast.info("Yêu cầu xóa bài học: " + lesson);
        // await deleteSet(id).unwrap();
        // toast.success("Đã xóa bộ thẻ thành công");
      } catch (error) {
        toast.error("Lỗi khi xóa bộ thẻ");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Đang tải dữ liệu bộ thẻ...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed">
        <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <p className="font-bold mb-1">Không thể tải dữ liệu</p>
        <p className="text-sm text-muted-foreground mb-4">Vui lòng kiểm tra API endpoint /flashcards.</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2 h-10 px-6 font-bold">
          <RefreshCw className="size-4" />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview stats cards matching admin pattern */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <Card className="border-none shadow-sm shadow-indigo-100/50 bg-white/70 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription className="font-bold text-xs uppercase tracking-wider text-slate-500">Tổng bộ thẻ</CardDescription>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-black">{sets.length}</CardTitle>
            <p className="text-[10px] text-emerald-600 font-bold mt-2 bg-emerald-50 px-2 py-0.5 inline-block rounded">Sẵn sàng sử dụng</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm shadow-indigo-100/50 bg-white/70 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription className="font-bold text-xs uppercase tracking-wider text-slate-500">Tổng số thẻ</CardDescription>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-black">{apiFlashcards?.length || 0}</CardTitle>
            <p className="text-[10px] text-slate-400 font-bold mt-2">Dữ liệu từ vựng & Kanji</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-none shadow-xl shadow-indigo-100/20 overflow-hidden bg-white">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-8 bg-slate-50/30 border-b border-slate-50">
          <div>
            <CardTitle className="text-xl font-black tracking-tight text-slate-900">Danh sách bài học</CardTitle>
            <CardDescription className="font-bold text-sm text-slate-500">Quản lý nội dung học theo từng chương trình.</CardDescription>
          </div>
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Tìm kiếm theo bài học hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 border-slate-200 rounded-xl font-bold text-sm bg-white shadow-sm focus:ring-4 focus:ring-primary/5 transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-50 hover:bg-transparent">
                  <TableHead className="py-5 px-8 font-black text-slate-700 uppercase text-[10px] tracking-widest">BỘ CHỨA THẺ</TableHead>
                  <TableHead className="font-black text-slate-700 uppercase text-[10px] tracking-widest">BÀI HỌC GỐC</TableHead>
                  <TableHead className="font-black text-slate-700 uppercase text-[10px] tracking-widest text-center">SỐ LƯỢNG</TableHead>
                  <TableHead className="font-black text-slate-700 uppercase text-[10px] tracking-widest text-center">TRẠNG THÁI</TableHead>
                  <TableHead className="py-5 px-8 font-black text-slate-700 uppercase text-[10px] tracking-widest text-right">HÀNH ĐỘNG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSets.length > 0 ? (
                  filteredSets.map((set) => (
                    <TableRow key={set.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                      <TableCell className="py-6 px-8 font-bold text-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                            <Layers className="size-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black tracking-tight">{set.name}</p>
                             <p className="text-[11px] text-slate-400 font-bold truncate max-w-[200px] mt-1 italic">{set.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-black bg-white border-slate-200 text-slate-600 tracking-tight text-[11px] px-3 py-1 uppercase scale-95 origin-left">
                          {set.lesson}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-lg font-black text-slate-900">{set.numCards}</span>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Thẻ bài</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                           <div className="size-2 rounded-full bg-emerald-500 shadow-sm animate-pulse shadow-emerald-200" />
                           <span className="text-[10px] font-black uppercase text-emerald-600 tracking-tighter">Active</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-8 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-slate-100 rounded-full transition-all">
                              <MoreHorizontal className="size-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl border-slate-100 z-[50]">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3 py-2">Quản trị thẻ</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setViewingSet(set)} className="gap-3 py-3 rounded-lg focus:bg-primary/5 cursor-pointer font-bold text-sm">
                              <Eye className="size-4 text-slate-400" /> Xem nội dung bộ này
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingSet(set)} className="gap-3 py-3 rounded-lg focus:bg-primary/5 cursor-pointer font-bold text-sm">
                              <Edit className="size-4 text-slate-400" /> Cập nhật thông tin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-slate-50" />
                            <DropdownMenuItem 
                              onClick={() => {
                                exportFlashcardsToExcel(
                                  apiFlashcards?.filter(c => c.lesson === set.lesson) || [],
                                  `${set.lesson}.xlsx`
                                );
                                toast.success("Đã chuẩn bị file Excel cho: " + set.lesson);
                              }} 
                              className="gap-3 py-3 rounded-lg focus:bg-primary/5 cursor-pointer font-bold text-sm"
                            >
                              <FileSpreadsheet className="size-4 text-emerald-500" /> Xuất báo cáo Excel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-slate-50" />
                            <DropdownMenuItem
                              onClick={() => handleDeleteSet(set.lesson)}
                              className="text-destructive gap-3 py-3 rounded-lg focus:bg-destructive/10 focus:text-destructive cursor-pointer font-bold text-sm"
                            >
                              <Trash2 className="size-4" /> Gỡ bỏ bộ bài học
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-32 text-center bg-slate-50/20">
                      <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95">
                        <div className="p-6 bg-slate-100 rounded-[2.5rem] text-slate-300">
                           <Layers className="size-16" />
                        </div>
                        <div className="space-y-1">
                           <p className="text-slate-800 font-black text-xl">Không tìm thấy dữ liệu.</p>
                           <p className="text-slate-400 font-bold text-sm tracking-tight">Thử thay đổi từ khóa tìm kiếm hoặc tạo bộ mới.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals integrated with management actions */}
      <FlashcardSetDetailModal
        open={viewingSet !== null}
        onOpenChange={(open) => !open && setViewingSet(null)}
        set={viewingSet}
        cards={apiFlashcards?.filter(c => c.lesson === viewingSet?.lesson) || []}
        onEditCard={(card) => setEditingCard(card)}
        onDeleteCard={() => toast.success("Thẻ đã được đánh dấu xóa")}
        onAddCard={() => setIsCreateCardModalOpen(true)}
      />

      <CreateFlashcardSetModal
        open={editingSet !== null || isCreateSetModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSet(null);
            setIsCreateSetModalOpen(false);
          }
        }}
        editData={editingSet}
        onSuccess={() => {
          setEditingSet(null);
          setIsCreateSetModalOpen(false);
          refetch(); // Reload data
        }}
      />

      <CreateFlashcardModal
        open={editingCard !== null || isCreateCardModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCard(null);
            setIsCreateCardModalOpen(false);
          }
        }}
        editData={editingCard}
        onCreateSuccess={() => {
          setEditingCard(null);
          setIsCreateCardModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};
