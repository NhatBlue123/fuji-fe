"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

interface CreateFlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = "list" | "card";

export default function CreateFlashcardModal({
  open,
  onOpenChange,
}: CreateFlashcardModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [isPublic, setIsPublic] = useState(false);
  const [level, setLevel] = useState("N5");

  // Form states for Flash List
  const [listTitle, setListTitle] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [searchFlashcard, setSearchFlashcard] = useState("");
  const [listThumbnail, setListThumbnail] = useState<string | null>(null);

  // Form states for Flash Card
  const [cardName, setCardName] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [cardContent, setCardContent] = useState("");
  const [cardThumbnail, setCardThumbnail] = useState<string | null>(null);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "list" | "card",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "list") {
          setListThumbnail(reader.result as string);
        } else {
          setCardThumbnail(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (activeTab === "list") {
      console.log("Creating Flash List:", {
        title: listTitle,
        description: listDescription,
        level,
        isPublic,
        searchFlashcard,
        thumbnail: listThumbnail,
      });
    } else {
      console.log("Creating Flash Card:", {
        name: cardName,
        description: cardDescription,
        content: cardContent,
        level,
        isPublic,
        thumbnail: cardThumbnail,
      });
    }
    // Reset form and close modal
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0B1120] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="sr-only">Tạo mới FlashCard</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === "list"
                ? "bg-secondary text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Flash List
          </button>
          <button
            onClick={() => setActiveTab("card")}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === "card"
                ? "bg-secondary text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Flash Card
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-4">
            {activeTab === "list" ? (
              <>
                {/* Flash List Form */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tiêu đề FlashList...
                  </label>
                  <input
                    type="text"
                    value={listTitle}
                    onChange={(e) => setListTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-500"
                    placeholder="Nhập tiêu đề..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mô tả...
                  </label>
                  <textarea
                    value={listDescription}
                    onChange={(e) => setListDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-500 resize-none"
                    placeholder="Nhập mô tả..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    JLPT Level
                  </label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-white border-white/10">
                      <SelectItem value="N5">N5</SelectItem>
                      <SelectItem value="N4">N4</SelectItem>
                      <SelectItem value="N3">N3</SelectItem>
                      <SelectItem value="N2">N2</SelectItem>
                      <SelectItem value="N1">N1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="text-sm font-medium">Công khai</label>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isPublic ? "bg-secondary" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        isPublic ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tìm flashcard để thêm...
                  </label>
                  <input
                    type="text"
                    value={searchFlashcard}
                    onChange={(e) => setSearchFlashcard(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-500"
                    placeholder="Tìm kiếm flashcard..."
                  />
                </div>
              </>
            ) : (
              <>
                {/* Flash Card Form */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tên bộ FlashCard...
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-500"
                    placeholder="Nhập tên bộ FlashCard..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mô tả...
                  </label>
                  <textarea
                    value={cardDescription}
                    onChange={(e) => setCardDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-500 resize-none"
                    placeholder="Nhập mô tả..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    JLPT Level
                  </label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-white border-white/10">
                      <SelectItem value="N5">N5</SelectItem>
                      <SelectItem value="N4">N4</SelectItem>
                      <SelectItem value="N3">N3</SelectItem>
                      <SelectItem value="N2">N2</SelectItem>
                      <SelectItem value="N1">N1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="text-sm font-medium">Công khai</label>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isPublic ? "bg-secondary" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        isPublic ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nội dung thẻ (mỗi dòng một thẻ)
                  </label>
                  <textarea
                    value={cardContent}
                    onChange={(e) => setCardContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-400 resize-none font-mono text-sm"
                    placeholder="mặt trước - mặt sau"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="font-semibold">Hướng dẫn nhập liệu:</span>
                    <br />
                    Mỗi dòng là một thẻ học tập
                    <br />
                    Dùng dấu &quot;-&quot; để phân tách từ vựng và nghĩa
                    <br />
                    <span className="text-gray-400">Ví dụ:</span>
                    <br />• hello - xin chào
                    <br />• goodbye - tạm biệt
                    <br />• thanks - cảm ơn
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Thumbnail */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Ảnh Thumbnail
            </label>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-pink-500/50 transition-colors">
              {(activeTab === "list" ? listThumbnail : cardThumbnail) ? (
                <div className="relative w-full h-64">
                  <Image
                    src={activeTab === "list" ? listThumbnail! : cardThumbnail!}
                    alt="Thumbnail"
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button
                    onClick={() =>
                      activeTab === "list"
                        ? setListThumbnail(null)
                        : setCardThumbnail(null)
                    }
                    className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      close
                    </span>
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="flex flex-col items-center justify-center py-12">
                    <span className="material-symbols-outlined text-6xl text-gray-500 mb-4">
                      image
                    </span>
                    <p className="text-gray-400 mb-2">Chọn ảnh</p>
                    <p className="text-xs text-gray-600">PNG, JPG, GIF</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, activeTab)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            className="w-full py-3.5 bg-secondary hover:bg-pink-600 text-white font-bold rounded-lg transition-colors"
          >
            Lưu FlashCard
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
