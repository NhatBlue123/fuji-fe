"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Play,
    Pause,
    X,
    Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card } from "@/types/card";

interface ViewFlashcardModalProps {

    open: boolean;
    onOpenChange: (open: boolean) => void;
    cards: Card[];
    flashCardLevel: string;
    initialIndex?: number;
}

type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export const ViewFlashcardModal = ({
    open,
    onOpenChange,
    cards,
    flashCardLevel: JlptLevel,
    initialIndex = 0,
}
    : ViewFlashcardModalProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAutoPlay, setIsAutoPlay] = useState(false);

    const currentCard = cards[currentIndex];

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlay || !open) return;

        const interval = setInterval(() => {
            handleNext();
        }, 3000); // 3 seconds per card

        return () => clearInterval(interval);
    }, [isAutoPlay, currentIndex, open]);

    // Reset when modal opens
    useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex);
            setIsFlipped(false);
        }
    }, [open, initialIndex]);

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        } else {
            setCurrentIndex(0); // Loop back to start
            setIsFlipped(false);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsFlipped(false);
        } else {
            setCurrentIndex(cards.length - 1); // Loop to end
            setIsFlipped(false);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    if (!currentCard) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) {
                setIsFlipped(false);
                setIsAutoPlay(false);
                setIsFullscreen(false);
            }
        }}>
            <DialogContent className={cn(
                "p-0 overflow-hidden border-none shadow-2xl transition-all duration-300",
                isFullscreen ? "max-w-full h-screen rounded-none" : "sm:max-w-3xl rounded-[2.5rem]"
            )}>
                {/* Header */}
                <div className={cn(
                    "p-6 flex items-center justify-between transition-colors duration-500",
                    isFlipped ? "bg-gradient-to-r from-amber-600 to-orange-600" : "bg-gradient-to-r from-indigo-600 to-purple-600"
                )}>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none font-black px-3 py-1.5 rounded-full backdrop-blur-md uppercase tracking-widest text-[10px]">
                            JLPT {JlptLevel}
                        </Badge>


                        <span className="text-white/80 font-bold text-sm">
                            {currentIndex + 1} / {cards.length}
                        </span>
                    </div>
                </div>

                {/* Card Container */}
                <div className={cn(
                    "px-8 pb-8 flex items-center justify-center",
                    isFullscreen ? "h-[calc(100vh-200px)]" : "h-[500px]"
                )}>
                    <div
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="relative w-full max-w-2xl h-full cursor-pointer perspective-1000"
                    >
                        {/* Front Side - Kanji */}
                        <div className={cn(
                            "absolute inset-0 w-full h-full bg-white rounded-3xl shadow-2xl border-2 border-indigo-100 p-12 flex flex-col items-center justify-center gap-6 transition-all duration-700 backface-hidden",
                            isFlipped ? "rotate-y-180 opacity-0" : "rotate-y-0 opacity-100"
                        )}>
                            <div className="size-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                                <span className="text-2xl">🇯🇵</span>
                            </div>
                            <h2 className={cn(
                                "font-black text-slate-900 tracking-tighter",
                                isFullscreen ? "text-9xl" : "text-8xl"
                            )}>{currentCard.kanji}</h2>
                            <p className={cn(
                                "font-bold text-slate-400 bg-slate-50 px-6 py-2 rounded-2xl",
                                isFullscreen ? "text-3xl" : "text-2xl"
                            )}>{currentCard.hiragana}</p>
                            <div className="absolute bottom-8 flex items-center gap-2 text-xs font-black text-indigo-300 uppercase tracking-widest animate-bounce-subtle">
                                Nhấp để xem nghĩa 👇
                            </div>
                        </div>

                        {/* Back Side - Meaning */}
                        <div className={cn(
                            "absolute inset-0 w-full h-full bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl shadow-2xl p-12 flex flex-col items-center justify-center gap-6 transition-all duration-700 backface-hidden",
                            isFlipped ? "rotate-y-0 opacity-100" : "rotate-y-180 opacity-0"
                        )}>
                            <div className="size-16 bg-white/20 rounded-full flex items-center justify-center text-white mb-4 backdrop-blur-md">
                                <span className="text-2xl">🇻🇳</span>
                            </div>
                            <h3 className={cn(
                                "font-black text-white tracking-tight leading-tight text-center max-w-lg",
                                isFullscreen ? "text-7xl" : "text-5xl"
                            )}>
                                {currentCard.meaning}
                            </h3>
                            <div className="h-1 w-20 bg-white/30 rounded-full my-2" />
                            <p className={cn(
                                "text-white/90 font-bold text-center max-w-xl leading-relaxed",
                                isFullscreen ? "text-2xl" : "text-lg"
                            )}>
                                {currentCard.example}
                            </p>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled
                                title="Chưa hỗ trợ phát âm"
                                className="absolute top-8 right-8 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                            >
                                <Volume2 className="size-6" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-8 pb-8 pt-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between gap-4">
                        {/* Navigation */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePrevious}
                                className="size-12 rounded-xl border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                            >
                                <ChevronLeft className="size-6" />
                            </Button>
                            <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 min-w-[100px] text-center">
                                <span className="font-black text-slate-900 text-lg">
                                    {currentIndex + 1}
                                </span>
                                <span className="text-slate-400 font-bold text-sm"> / {cards.length}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleNext}
                                className="size-12 rounded-xl border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                            >
                                <ChevronRight className="size-6" />
                            </Button>
                        </div>

                        {/* Center Actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsAutoPlay(!isAutoPlay)}
                                className={cn(
                                    "h-12 px-6 rounded-xl font-bold gap-2 transition-all",
                                    isAutoPlay
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                        : "border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                {isAutoPlay ? (
                                    <>
                                        <Pause className="size-5" />
                                        Đang tự động
                                    </>
                                ) : (
                                    <>
                                        <Play className="size-5" />
                                        Tự động cuộn
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleFullscreen}
                                className={cn(
                                    "size-12 rounded-xl transition-all",
                                    isFullscreen
                                        ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                        : "border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <Maximize2 className="size-5" />
                            </Button>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex-1 max-w-xs">
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
                                    style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 text-center">
                                Tiến độ học tập
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
