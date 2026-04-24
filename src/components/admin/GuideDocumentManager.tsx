"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Edit3,
  Trash2,
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Eye,
  Save,
  X,
} from "lucide-react";

import {
  useGetGuideDocumentStatusQuery,
  useUploadGuideDocumentMutation,
  useLazyGetGuideDocumentQuery,
  useUpdateGuideDocumentMutation,
  useActivateGuideDocumentMutation,
  useReindexGuideDocumentMutation,
  useResetGuideDocumentIndexMutation,
  useDeleteGuideDocumentMutation,
  type GuideDocument,
} from "@/store/services/admin/aiGuideDocApi";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function formatDateTime(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const err = error as {
      data?: {
        error?: { message?: string };
        message?: string;
      };
      message?: string;
    };

    return (
      err.data?.error?.message || err.data?.message || err.message || fallback
    );
  }
  return fallback;
}

export default function GuideDocumentManager() {
  const [editingDoc, setEditingDoc] = useState<GuideDocument | null>(null);
  const [editContent, setEditContent] = useState("");
  const [viewingDoc, setViewingDoc] = useState<GuideDocument | null>(null);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<GuideDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusQuery = useGetGuideDocumentStatusQuery();
  const [uploadDoc, uploadState] = useUploadGuideDocumentMutation();
  const [getDoc] = useLazyGetGuideDocumentQuery();
  const [updateDoc, updateState] = useUpdateGuideDocumentMutation();
  const [activateDoc, activateState] = useActivateGuideDocumentMutation();
  const [reindexDoc, reindexState] = useReindexGuideDocumentMutation();
  const [resetIndex, resetState] = useResetGuideDocumentIndexMutation();
  const [deleteDoc, deleteState] = useDeleteGuideDocumentMutation();

  const activeDoc = statusQuery.data?.data?.activeDocument;
  const documents = statusQuery.data?.data?.documents || [];
  const collection = statusQuery.data?.data?.collection;

  const isBusy =
    uploadState.isLoading ||
    updateState.isLoading ||
    activateState.isLoading ||
    reindexState.isLoading ||
    resetState.isLoading ||
    deleteState.isLoading;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt")) {
      toast.error("Chỉ chấp nhận file .txt");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File quá lớn (tối đa 5MB)");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const resp = await uploadDoc(formData).unwrap();
      toast.success(resp.message || "Upload thành công");
      statusQuery.refetch();
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Upload thất bại"));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEdit = async (doc: GuideDocument) => {
    try {
      const resp = await getDoc(doc.id).unwrap();
      if (resp.data) {
        setEditingDoc(resp.data as GuideDocument);
        setEditContent(resp.data.content || "");
      }
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Không thể tải nội dung"));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingDoc) return;

    try {
      const resp = await updateDoc({
        id: editingDoc.id,
        content: editContent,
      }).unwrap();
      toast.success(resp.message || "Cập nhật thành công");
      setEditingDoc(null);
      setEditContent("");
      statusQuery.refetch();
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Cập nhật thất bại"));
    }
  };

  const handleView = async (doc: GuideDocument) => {
    try {
      const resp = await getDoc(doc.id).unwrap();
      if (resp.data) {
        setViewingDoc(resp.data as GuideDocument);
      }
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Không thể tải nội dung"));
    }
  };

  const handleActivate = async (id: number) => {
    try {
      const resp = await activateDoc(id).unwrap();
      toast.success(resp.message || "Kích hoạt thành công");
      statusQuery.refetch();
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Kích hoạt thất bại"));
    }
  };

  const handleReindex = async (id: number) => {
    try {
      const resp = await reindexDoc(id).unwrap();
      toast.success(resp.message || "Reindex thành công");
      statusQuery.refetch();
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Reindex thất bại"));
    }
  };

  const handleResetIndex = async () => {
    const ok = window.confirm(
      "Bạn chắc chắn muốn đặt lại toàn bộ chỉ mục Guide? Tất cả chunks sẽ bị xóa khỏi Qdrant.",
    );
    if (!ok) return;

    try {
      const resp = await resetIndex().unwrap();
      toast.success(resp.message || "Đặt lại index thành công");
      statusQuery.refetch();
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Đặt lại index thất bại"));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmDoc) return;

    try {
      const resp = await deleteDoc(deleteConfirmDoc.id).unwrap();
      toast.success(resp.message || "Xóa thành công");
      setDeleteConfirmDoc(null);
      statusQuery.refetch();
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Xóa thất bại"));
    }
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-4">
        {/* Active Document Card */}
        {activeDoc && (
          <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-emerald-900">
                    Tài liệu đang hoạt động
                  </h3>
                  <Badge className="bg-emerald-600 text-white">Active</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-emerald-800">
                  {activeDoc.filename}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-emerald-600">Ký tự</p>
                    <p className="font-bold text-emerald-900">
                      {(activeDoc.charCount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-600">Chunks</p>
                    <p className="font-bold text-emerald-900">
                      {activeDoc.chunkCount || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-600">Kích hoạt</p>
                    <p className="font-bold text-emerald-900">
                      {formatDateTime(activeDoc.activatedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-600">Index lần cuối</p>
                    <p className="font-bold text-emerald-900">
                      {formatDateTime(activeDoc.indexedAt)}
                    </p>
                  </div>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleReindex(activeDoc.id)}
                    disabled={isBusy}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  >
                    {reindexState.isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Reindex
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold">Reindex tài liệu</p>
                  <p className="text-xs mt-1">
                    Chia nhỏ nội dung thành các chunks và tạo vector embeddings để lưu vào Qdrant. AI sẽ dùng dữ liệu này để trả lời câu hỏi người dùng.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Collection Info */}
        {collection && (
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Collection: <strong>{collection.name}</strong> • Points:{" "}
              <strong>{collection.pointsCount}</strong> • Indexed:{" "}
              <strong>{collection.indexedVectorsCount}</strong>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleUpload}
            className="hidden"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="rounded-xl font-bold"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload .txt
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold">Upload tài liệu hướng dẫn</p>
              <p className="text-xs mt-1">
                Tải lên file .txt chứa nội dung hướng dẫn sử dụng hệ thống. File sẽ được lưu trên Cloudinary và database.
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => statusQuery.refetch()}
                disabled={statusQuery.isFetching}
                className="rounded-xl font-bold"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${statusQuery.isFetching ? "animate-spin" : ""}`}
                />
                Làm mới
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tải lại danh sách tài liệu</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                onClick={handleResetIndex}
                disabled={isBusy}
                className="rounded-xl"
              >
                {resetState.isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Đặt lại toàn bộ Index
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold text-red-500">⚠️ Thao tác nguy hiểm</p>
              <p className="text-xs mt-1">
                Xóa toàn bộ vector embeddings trong Qdrant. Sau khi reset, bạn cần Reindex lại từng tài liệu để AI có thể trả lời câu hỏi.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Documents Table */}
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên file</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ký tự</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Upload lúc</TableHead>
                <TableHead>Index lúc</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statusQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}

              {!statusQuery.isLoading && documents.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    Chưa có tài liệu nào. Hãy upload file .txt đầu tiên.
                  </TableCell>
                </TableRow>
              )}

              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.filename}</TableCell>
                  <TableCell>
                    {doc.isActive ? (
                      <Badge className="bg-emerald-600 text-white">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{doc.charCount.toLocaleString()}</TableCell>
                  <TableCell>{doc.chunkCount}</TableCell>
                  <TableCell>{formatDateTime(doc.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(doc.indexedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Xem nội dung tài liệu</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(doc)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Chỉnh sửa nội dung</p>
                          <p className="text-xs text-muted-foreground">Cần Reindex sau khi sửa</p>
                        </TooltipContent>
                      </Tooltip>

                      {!doc.isActive && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleActivate(doc.id)}
                              disabled={isBusy}
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Kích hoạt tài liệu này</p>
                            <p className="text-xs text-muted-foreground">AI sẽ dùng tài liệu này để trả lời</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReindex(doc.id)}
                            disabled={isBusy}
                          >
                            <Sparkles className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reindex tài liệu</p>
                          <p className="text-xs text-muted-foreground">Tạo lại vector embeddings</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmDoc(doc)}
                            disabled={isBusy}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-red-500">Xóa tài liệu</p>
                          <p className="text-xs text-muted-foreground">Xóa khỏi DB và Qdrant</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa: {editingDoc?.filename}</DialogTitle>
              <DialogDescription>
                Chỉnh sửa nội dung tài liệu. Sau khi lưu, bạn cần reindex để cập
                nhật vào Qdrant.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Ký tự: {editContent.length.toLocaleString()}
                </p>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Nhập nội dung tài liệu..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingDoc(null)}
                disabled={updateState.isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Hủy
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateState.isLoading}
              >
                {updateState.isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Xem: {viewingDoc?.filename}</DialogTitle>
              <DialogDescription>
                Nội dung tài liệu (chỉ đọc)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {viewingDoc?.content || "(Không có nội dung)"}
                </pre>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setViewingDoc(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog
          open={!!deleteConfirmDoc}
          onOpenChange={() => setDeleteConfirmDoc(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa tài liệu{" "}
                <strong>{deleteConfirmDoc?.filename}</strong>? Hành động này
                không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmDoc(null)}
                disabled={deleteState.isLoading}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteState.isLoading}
              >
                {deleteState.isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
