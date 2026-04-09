"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  useGetMaterialsQuery,
  useSaveMaterialMutation,
  useDeleteMaterialMutation,
} from "@/store/services/lessonApi";
import { useMaterialSync } from "@/hooks/useMaterialSync";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Link2,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface MaterialsPanelProps {
  lessonId: number;
  token: string | null;
  isTeacher: boolean;
}

export function MaterialsPanel({ lessonId, token, isTeacher }: MaterialsPanelProps) {
  const { data: materials, refetch } = useGetMaterialsQuery({ lessonId });
  const [saveMaterial] = useSaveMaterialMutation();
  const [deleteMaterial] = useDeleteMaterialMutation();
  const { syncedPage, sendPageSync, isSyncEnabled, toggleSync } = useMaterialSync(lessonId, token);

  const [viewingMaterial, setViewingMaterial] = useState<{
    id: number;
    url: string;
    name: string;
    type: string | null;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply synced page from peer
  useEffect(() => {
    if (!syncedPage || !isSyncEnabled) return;
    if (viewingMaterial && syncedPage.materialId === viewingMaterial.id) {
      setCurrentPage(syncedPage.pageNumber);
    }
  }, [syncedPage, viewingMaterial, isSyncEnabled]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("files", file);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8181/api";
        const res = await fetch(`${apiUrl}/upload/reports`, {
          method: "POST",
          body: formData,
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
          },
        });

        const json = await res.json();
        if (!json.success || !json.data?.[0]) {
          throw new Error("Upload failed");
        }

        const fileUrl = json.data[0];
        const fileType = file.type.startsWith("image/") ? "IMAGE" : "PDF";

        await saveMaterial({
          lessonId,
          name: file.name,
          url: fileUrl,
          type: fileType,
          size: file.size,
        }).unwrap();

        refetch();
        toast.success("Tải lên thành công!");
      } catch {
        toast.error("Không thể tải tệp lên");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [lessonId, token, saveMaterial, refetch]
  );

  const handleUrlSubmit = useCallback(async () => {
    const url = urlInput.trim();
    const name = nameInput.trim() || url.split("/").pop() || "Material";
    if (!url) return;

    try {
      const type = url.match(/\.(pdf)$/i) ? "PDF" : url.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? "IMAGE" : "LINK";
      await saveMaterial({ lessonId, name, url, type }).unwrap();
      refetch();
      setUrlInput("");
      setNameInput("");
      setShowUrlForm(false);
      toast.success("Tài liệu đã thêm!");
    } catch {
      toast.error("Không thể thêm tài liệu");
    }
  }, [urlInput, nameInput, lessonId, saveMaterial, refetch]);

  const handleDelete = useCallback(
    async (materialId: number) => {
      try {
        await deleteMaterial({ lessonId, materialId }).unwrap();
        refetch();
        if (viewingMaterial?.id === materialId) setViewingMaterial(null);
        toast.success("Đã xóa tài liệu");
      } catch {
        toast.error("Không thể xóa");
      }
    },
    [lessonId, deleteMaterial, refetch, viewingMaterial]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      if (isTeacher && viewingMaterial) {
        sendPageSync(viewingMaterial.id, page);
      }
    },
    [isTeacher, viewingMaterial, sendPageSync]
  );

  // PDF viewer mode
  if (viewingMaterial) {
    const isPdf = viewingMaterial.type === "PDF" || viewingMaterial.url.match(/\.pdf$/i);

    return (
      <div className="flex flex-col h-full">
        {/* Viewer header */}
        <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
          <button
            onClick={() => setViewingMaterial(null)}
            className="flex items-center gap-1 text-xs text-[#8B8FA8] hover:text-[#F0F0F0]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Quay lại
          </button>
          <span className="text-[10px] text-[#8B8FA8] truncate max-w-[120px]">{viewingMaterial.name}</span>
          <button
            onClick={toggleSync}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium",
              isSyncEnabled
                ? "bg-[#4ECDC4]/20 text-[#4ECDC4]"
                : "bg-white/5 text-[#8B8FA8]"
            )}
          >
            Sync {isSyncEnabled ? "ON" : "OFF"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto bg-[#252838] flex items-start justify-center p-2">
          {isPdf ? (
            <Document
              file={viewingMaterial.url}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              loading={<Loader2 className="h-6 w-6 text-[#8B8FA8] animate-spin mt-10" />}
              error={<p className="text-[#FF6B6B] text-xs mt-10">Không thể tải PDF</p>}
            >
              <Page
                pageNumber={currentPage}
                width={350}
                renderTextLayer
                renderAnnotationLayer
              />
            </Document>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={viewingMaterial.url}
              alt={viewingMaterial.name}
              className="max-w-full max-h-full object-contain rounded"
            />
          )}
        </div>

        {/* Page controls */}
        {isPdf && numPages > 0 && (
          <div className="shrink-0 flex items-center justify-center gap-3 py-2 border-t border-white/[0.08]">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded text-[#8B8FA8] hover:text-[#F0F0F0] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-[#F0F0F0] font-mono">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="p-1 rounded text-[#8B8FA8] hover:text-[#F0F0F0] disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Material list mode
  return (
    <div className="flex flex-col h-full">
      {/* Upload actions (teacher only) */}
      {isTeacher && (
        <div className="shrink-0 p-3 border-b border-white/[0.08] space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#6C63FF]/10 text-[#6C63FF] text-xs font-medium hover:bg-[#6C63FF]/20 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Tải file
            </button>
            <button
              onClick={() => setShowUrlForm(!showUrlForm)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-[#8B8FA8] text-xs font-medium hover:bg-white/10 transition-colors"
            >
              <Link2 className="h-3.5 w-3.5" />
              Thêm URL
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
            onChange={handleFileUpload}
            className="hidden"
          />

          {showUrlForm && (
            <div className="space-y-1.5">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Tên tài liệu"
                className="w-full bg-[#252838] border border-white/10 text-xs text-[#F0F0F0] placeholder:text-[#8B8FA8]/50 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]"
              />
              <div className="flex gap-1.5">
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-[#252838] border border-white/10 text-xs text-[#F0F0F0] placeholder:text-[#8B8FA8]/50 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]"
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="px-3 rounded-lg bg-[#6C63FF] text-white text-xs font-medium disabled:opacity-30"
                >
                  Thêm
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Material list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
        {(!materials || materials.length === 0) && (
          <div className="h-full flex items-center justify-center">
            <p className="text-[#8B8FA8] text-xs text-center">
              {isTeacher ? "Tải tài liệu lên để chia sẻ với học viên" : "Chưa có tài liệu nào"}
            </p>
          </div>
        )}

        {materials?.map((m) => {
          const isImage = m.type === "IMAGE" || m.url.match(/\.(png|jpg|jpeg|gif|webp)$/i);
          const isPdf = m.type === "PDF" || m.url.match(/\.pdf$/i);
          const Icon = isPdf ? FileText : isImage ? ImageIcon : Link2;

          return (
            <div
              key={m.id}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-colors group cursor-pointer"
              onClick={() => {
                setViewingMaterial({ id: m.id, url: m.url, name: m.name, type: m.type });
                setCurrentPage(1);
                setNumPages(0);
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-[#6C63FF]/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-[#6C63FF]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#F0F0F0] font-medium truncate">{m.name}</p>
                <p className="text-[10px] text-[#8B8FA8]">
                  {m.type ?? "FILE"}
                  {m.size ? ` • ${(m.size / 1024).toFixed(0)} KB` : ""}
                </p>
              </div>
              {isTeacher && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(m.id);
                  }}
                  className="p-1 rounded text-[#8B8FA8] opacity-0 group-hover:opacity-100 hover:text-[#FF6B6B] transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
