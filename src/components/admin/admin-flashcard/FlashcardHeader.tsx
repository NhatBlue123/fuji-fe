"use client";

import React from "react";
import Link from "next/link";
import { Bell, HelpCircle } from "lucide-react";

export const FlashcardHeader = () => {
    return (
        <div className="mb-10">
            {/* Top Bar with Breadcrumb and Icons */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/admin" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                    <span className="text-slate-300">/</span>
                    <span className="font-medium text-slate-900">Flashcards</span>
                </div>

                <div className="flex items-center gap-4">
                    <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <Bell className="size-5" />
                        <span className="absolute top-2 right-2 size-2 bg-orange-500 rounded-full border-2 border-white" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <HelpCircle className="size-5" />
                    </button>
                </div>
            </div>

            {/* Main Header Content */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Flashcard Manager</h1>
                <p className="text-slate-500 text-lg font-medium">Manage your flashcard sets and individual cards efficiently.</p>
            </div>
        </div>
    );
};
