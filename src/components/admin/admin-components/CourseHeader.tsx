"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Bell, HelpCircle } from "lucide-react";

export const CourseHeader = () => {
    return (
        <div className="mb-10">
            {/* Top Bar with Breadcrumb and Icons */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Dashboard</span>
                    <span className="text-slate-300">/</span>
                    <span className="font-medium text-slate-900">Courses</span>
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Quản lý khóa học</h1>
                    <p className="text-slate-500 text-lg font-medium">Manage your curriculum and track student progress.</p>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-14 px-8 rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 gap-2 shrink-0 text-md">
                    <Plus className="size-5 stroke-[3px]" />
                    Tạo khóa học mới
                </Button>
            </div>
        </div>
    );
};
