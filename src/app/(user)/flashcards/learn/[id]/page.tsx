"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import styles from "./page.module.css";

const mockCard = {
  id: 1,
  status: "Mới học",
  kana: "学生",
  romaji: "gakusei",
  meaning: "Học sinh",
  detail: '"Người đang theo học tại trường"',
  example: {
    japanese: "私は学生です。",
    romaji: "Watashi wa gakusei desu.",
    vietnamese: "Tôi là học sinh.",
  },
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCTyfbd-hnxHrIXJ1Sy5_LzcWGbNso2IRzDE8u7Ney3n-lLtyXDklyJSmjt_Apo6CkvtqT4SCwD5DRyuKYSHpPD9anvAN9NYmwVHzTbhQZpZChwHJdhcsYvy_yjA7m4vHEglPugU7e12CdtvLtnOevbiyOs4d6M9L-KmcnQ2NTd24cg0Wl_GYeBrvJotem__c2-28i9FpzraK6gQpJZ4uNRGdzEwSuhQAt-K4Wo56q-xYjnxenMeHSOxjtt7q5jGrqyRCIITNP1e9c",
};

export default function FlashcardStudyPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCard] = useState(0);
  const [totalCards] = useState(40);
  const [learnedCards] = useState(12);
  const [imageMode, setImageMode] = useState<
    "front" | "back" | "both" | "none"
  >("front");

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnown = () => {
    // TODO: Implement known logic
    setIsFlipped(false);
  };

  const handleUnknown = () => {
    // TODO: Implement unknown logic
    setIsFlipped(false);
  };

  const handleShuffle = () => {
    // TODO: Implement shuffle logic
  };

  const handleFlipAll = () => {
    // TODO: Implement flip all logic
  };

  const handlePlayAudio = () => {
    // TODO: Implement audio playback
  };

  const progress = Math.round((learnedCards / totalCards) * 100);

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background text-foreground">
      <div
        className={`absolute inset-0 ${styles.radialBg} pointer-events-none`}
      ></div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 md:px-10 border-b border-border/40 backdrop-blur-md z-30 bg-background/50">
        <div className="flex items-center gap-4 w-1/4">
          <Link
            href="/flashcards/sets/1"
            className="flex items-center justify-center size-9 rounded-full bg-card/40 hover:bg-card/60 text-muted-foreground hover:text-foreground transition-all border border-border/40"
          >
            <span className="material-symbols-outlined text-xl">
              arrow_back
            </span>
          </Link>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Đang học
            </span>
            <h2 className="text-xs md:text-sm font-bold text-foreground truncate max-w-[200px] md:max-w-xs">
              Từ vựng Minna no Nihongo
            </h2>
          </div>
        </div>

        <div className="flex-1 max-w-lg mx-auto flex flex-col items-center gap-1.5">
          <div className="flex justify-between w-full text-[10px] font-medium text-muted-foreground">
            <span>{learnedCards} thẻ</span>
            <span>{totalCards} thẻ</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/40 relative">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="w-1/4 flex justify-end items-center gap-1.5">
          <Select
            value={imageMode}
            onValueChange={(value: any) => setImageMode(value)}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs border-border/40 bg-card/40">
              <SelectValue placeholder="Hiển thị ảnh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front">Ảnh mặt trước</SelectItem>
              <SelectItem value="back">Ảnh mặt sau</SelectItem>
              <SelectItem value="both">Ảnh 2 mặt</SelectItem>
              <SelectItem value="none">Không có ảnh</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={handleShuffle}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-card/40 rounded-full"
            title="Trộn thẻ"
          >
            <span className="material-symbols-outlined text-xl">shuffle</span>
          </button>
          <button
            onClick={handleFlipAll}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-card/40 rounded-full"
            title="Đảo thẻ"
          >
            <span className="material-symbols-outlined text-xl">flip</span>
          </button>

          {/* Exercise Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-card/40 rounded-full"
                title="Bài tập"
              >
                <span className="material-symbols-outlined text-xl">quiz</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Chọn loại bài tập</DialogTitle>
                <DialogDescription>
                  Lựa chọn bài tập phù hợp để ôn luyện từ vựng
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Link
                  href="/flashcards/exercise/1/multiple-choice"
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 hover:border-primary/40 transition-all group cursor-pointer"
                >
                  <div className="size-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      checklist
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      Trắc nghiệm
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Chọn đáp án đúng từ 4 lựa chọn
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary transition-colors">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  href="/flashcards/exercise/1/fill-blank"
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 hover:border-secondary/40 transition-all group cursor-pointer"
                >
                  <div className="size-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-2xl">
                      edit_note
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground group-hover:text-secondary transition-colors">
                      Điền từ
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Gõ từ vựng chính xác vào ô trống
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground group-hover:text-secondary transition-colors">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </DialogContent>
          </Dialog>

          <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-card/40 rounded-full">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-card/40 rounded-full">
            <span className="material-symbols-outlined text-xl">help</span>
          </button>
        </div>
      </header>

      {/* Card Area */}
      <div
        className={`flex-1 flex flex-col items-center justify-center relative ${styles.perspectiveContainer} px-6 py-4`}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative w-full max-w-sm h-[420px] group cursor-pointer z-10">
          <div
            className={`${styles.cardInner} ${isFlipped ? styles.flipped : ""}`}
            onClick={handleCardClick}
          >
            {/* Front Side */}
            <div
              className={`absolute w-full h-full ${styles.backfaceHidden} ${styles.glassCard} rounded-3xl ${styles.shadowCard} flex flex-col overflow-hidden`}
            >
              <div className="flex justify-between items-center p-4 border-b border-border/40">
                <span className="px-2.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                  {mockCard.status}
                </span>
                <button className="text-muted-foreground hover:text-secondary transition-colors">
                  <span className="material-symbols-outlined text-xl">
                    bookmark
                  </span>
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
                {(imageMode === "front" || imageMode === "both") && (
                  <div className="relative size-32 rounded-2xl overflow-hidden shadow-2xl border-4 border-border/20 group-hover:scale-105 transition-transform duration-500">
                    <img
                      alt="Student Illustration"
                      className="w-full h-full object-cover"
                      src={mockCard.image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs text-secondary font-medium mb-0.5">
                    {mockCard.romaji}
                  </p>
                  <h1
                    className={`${imageMode === "none" || imageMode === "back" ? "text-6xl" : "text-5xl"} font-black text-foreground tracking-tight mb-1 drop-shadow-lg`}
                  >
                    {mockCard.kana}
                  </h1>
                </div>
              </div>

              <div className="p-3 bg-black/20 backdrop-blur-sm border-t border-border/40">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <span className="material-symbols-outlined text-base">
                    touch_app
                  </span>
                  Chạm để lật thẻ
                </div>
              </div>
            </div>

            {/* Back Side */}
            <div
              className={`absolute w-full h-full ${styles.backfaceHidden} ${styles.rotateY180} ${styles.glassCard} rounded-3xl ${styles.shadowCard} flex flex-col overflow-hidden bg-card`}
            >
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
                {(imageMode === "back" || imageMode === "both") && (
                  <div className="relative size-32 rounded-2xl overflow-hidden shadow-2xl border-4 border-border/20 mb-2">
                    <img
                      alt="Student Illustration"
                      className="w-full h-full object-cover"
                      src={mockCard.image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                )}
                <h2
                  className={`${imageMode === "back" || imageMode === "both" ? "text-xl" : "text-2xl"} font-bold text-foreground mb-1`}
                >
                  {mockCard.meaning}
                </h2>
                <p
                  className={`${imageMode === "back" || imageMode === "both" ? "text-sm" : "text-base"} text-muted-foreground italic`}
                >
                  {mockCard.detail}
                </p>
                <div className="w-full h-px bg-border/40 my-2"></div>
                <div className="text-left w-full">
                  <p className="text-xs text-muted-foreground mb-1">Ví dụ:</p>
                  <p
                    className={`${imageMode === "back" || imageMode === "both" ? "text-sm" : "text-base"} text-foreground`}
                  >
                    {mockCard.example.japanese}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mockCard.example.romaji}
                  </p>
                  <p className="text-xs text-foreground mt-1">
                    {mockCard.example.vietnamese}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Navigation */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            className="flex items-center justify-center size-10 rounded-xl bg-card/60 hover:bg-card/80 text-foreground border border-border/40 transition-all hover:scale-105"
            title="Thẻ trước"
          >
            <span className="material-symbols-outlined text-xl">
              arrow_back
            </span>
          </button>
          <div className="px-4 py-2 rounded-xl bg-card/40 border border-border/40 text-foreground font-bold text-sm min-w-[80px] text-center">
            {currentCard + 1}/{totalCards}
          </div>
          <button
            className="flex items-center justify-center size-10 rounded-xl bg-card/60 hover:bg-card/80 text-foreground border border-border/40 transition-all hover:scale-105"
            title="Thẻ tiếp theo"
          >
            <span className="material-symbols-outlined text-xl">
              arrow_forward
            </span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full px-6 py-4 md:pb-6 md:px-10 z-30 relative">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 md:gap-6">
          <button
            onClick={handleUnknown}
            className="flex-1 flex flex-col items-center gap-2 group"
          >
            <div
              className={`h-12 w-full md:w-36 rounded-2xl bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive hover:text-destructive flex items-center justify-center transition-all duration-300 ${styles.shadowGlowRed}`}
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground group-hover:text-destructive transition-colors uppercase tracking-wider">
              Chưa thuộc
            </span>
          </button>

          <button onClick={handlePlayAudio} className="relative -top-3 group">
            <div className="size-16 rounded-full bg-gradient-to-br from-muted to-card border border-border/40 flex items-center justify-center shadow-lg shadow-black/40 group-hover:scale-110 transition-transform duration-300 z-10 relative">
              <span className="material-symbols-outlined text-2xl text-foreground group-hover:text-secondary transition-colors">
                volume_up
              </span>
            </div>
            <div
              className={`absolute inset-0 bg-secondary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100`}
            ></div>
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
              Phát âm
            </span>
          </button>

          <button
            onClick={handleKnown}
            className="flex-1 flex flex-col items-center gap-2 group"
          >
            <div
              className={`h-12 w-full md:w-36 rounded-2xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 hover:text-green-300 flex items-center justify-center transition-all duration-300 ${styles.shadowGlowGreen}`}
            >
              <span className="material-symbols-outlined text-2xl">check</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground group-hover:text-green-400 transition-colors uppercase tracking-wider">
              Đã thuộc
            </span>
          </button>
        </div>

        <div className="mt-3 text-center">
          <button className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            Bỏ qua thẻ này
          </button>
        </div>
      </div>
    </div>
  );
}
