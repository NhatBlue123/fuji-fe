"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  useCreateCourseMutation,
  useGetInstructorsQuery,
} from "@/store/services/courseApi";
import { useAuth } from "@/store/hooks";
import Image from "next/image";
import { toast } from "sonner";

interface CreateCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, isAdmin } = useAuth();
  const [createCourse, { isLoading }] = useCreateCourseMutation();
  const { data: instructors, isLoading: loadingInstructors } =
    useGetInstructorsQuery(undefined, { skip: !isAdmin || !open });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setPrice("");
    setIsPublished(false);
    setSelectedInstructorId("");
    setThumbnailFile(null);
    setThumbnailPreview(null);
  }, []);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề khóa học");
      return;
    }
    if (!description.trim()) {
      toast.error("Vui lòng nhập mô tả khóa học");
      return;
    }

    // Determine instructorId: if admin picked one, use it; otherwise self
    const instructorId =
      isAdmin && selectedInstructorId ? Number(selectedInstructorId) : user?.id;

    if (!instructorId) {
      toast.error("Vui lòng chọn giảng viên");
      return;
    }

    const formData = new FormData();

    const courseData = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      instructorId,
      isPublished,
    };

    formData.append(
      "course",
      new Blob([JSON.stringify(courseData)], { type: "application/json" }),
    );

    if (thumbnailFile) {
      formData.append("thumbnail", thumbnailFile);
    }

    try {
      await createCourse({ course: formData }).unwrap();
      toast.success("Tạo khóa học thành công!");
      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "Tạo khóa học thất bại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo khóa học mới</DialogTitle>
          <DialogDescription>
            Điền thông tin bên dưới để tạo khóa học. Bạn có thể cập nhật sau.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>Ảnh bìa khóa học</Label>
            {thumbnailPreview ? (
              <div className="relative aspect-video w-full rounded-md overflow-hidden border bg-muted group">
                <Image
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={removeThumbnail}
                  className="absolute top-2 right-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-video w-full rounded-md border border-dashed bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                <ImagePlus className="size-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Nhấn để tải ảnh lên
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WEBP (tối đa 10MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
              </label>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Tiêu đề khóa học <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: JLPT N5 Comprehensive"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/200
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Mô tả <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết về nội dung khóa học..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Instructor Selector (Admin only) */}
          {isAdmin && (
            <div className="space-y-2">
              <Label>
                Giảng viên <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedInstructorId}
                onValueChange={setSelectedInstructorId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingInstructors
                        ? "Đang tải..."
                        : "Chọn giảng viên cho khóa học"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {instructors && instructors.length > 0 ? (
                    instructors.map((inst) => (
                      <SelectItem key={inst.id} value={String(inst.id)}>
                        {inst.fullName || inst.username}
                        <span className="text-muted-foreground ml-2 text-xs">
                          @{inst.username}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_empty" disabled>
                      Chưa có giảng viên nào
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Chọn giảng viên phụ trách khóa học này
              </p>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Giá (VNĐ)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="1000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0 = Miễn phí"
            />
          </div>

          {/* Published toggle */}
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-0.5">
              <Label>Xuất bản ngay</Label>
              <p className="text-xs text-muted-foreground">
                Khóa học sẽ hiển thị cho học viên sau khi xuất bản
              </p>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo khóa học"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
