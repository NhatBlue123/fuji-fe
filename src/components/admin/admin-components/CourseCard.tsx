"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Users, Clock, Trash2 } from "lucide-react";

interface CourseCardProps {
    title: string;
    description: string;
    image: string;
    level: string;
    status: "PUBLISHED" | "DRAFT";
    students: string;
    duration: string;
    levelColor?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
    title,
    description,
    image,
    level,
    status,
    students,
    duration,
    levelColor = "bg-orange-500",
}) => {
    return (
        <Card className="overflow-hidden border-slate-200 group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
            <div className="relative aspect-video w-full overflow-hidden">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <Badge
                        variant={status === "PUBLISHED" ? "default" : "secondary"}
                        className={status === "PUBLISHED" ? "bg-white/90 text-slate-900 border-none px-2 py-0.5 text-[10px] font-bold" : "bg-black/40 text-white border-none px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm"}
                    >
                        {status}
                    </Badge>
                </div>
                <div className={`absolute bottom-3 left-3 ${levelColor} text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg`}>
                    {level}
                </div>
            </div>

            <CardContent className="p-5">
                <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                    {title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {description}
                </p>

                <div className="flex items-center gap-4 py-2 border-t border-slate-100 text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Users className="size-4" />
                        <span className="text-xs font-medium">{students} Students</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="size-4" />
                        <span className="text-xs font-medium">{duration}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-5 pt-0 flex gap-2">
                <Button className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold transition-all shadow-sm">
                    {status === "PUBLISHED" ? "Chỉnh sửa" : "Tiếp tục soạn"}
                </Button>
                <Button variant="outline" size="icon" className="shrink-0 border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all">
                    <Trash2 className="size-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};
