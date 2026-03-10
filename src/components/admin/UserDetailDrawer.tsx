"use client";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Mail, Phone, MapPin, UserIcon, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

interface UserDetailDrawerProps {
    userId: number | null;
    isOpen: boolean;
    onClose: () => void;
    userDetail: any; // Ideally AdminUserDetailDTO
    isLoading: boolean;
}

export function UserDetailDrawer({
    userId,
    isOpen,
    onClose,
    userDetail,
    isLoading,
}: UserDetailDrawerProps) {
    if (!userId) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-xl p-0">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground animate-pulse font-medium">Đang tải thông tin...</p>
                    </div>
                ) : userDetail ? (
                    <div className="flex flex-col h-full">
                        <SheetHeader className="p-6 pb-0">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
                                    <AvatarImage src={userDetail.avatarUrl} />
                                    <AvatarFallback className="text-xl">
                                        {userDetail.fullName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <SheetTitle className="text-2xl font-bold tracking-tight">
                                        {userDetail.fullName}
                                    </SheetTitle>
                                    <SheetDescription className="flex items-center gap-2 mt-1">
                                        <span className="font-medium text-foreground/80">@{userDetail.username}</span>
                                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                                            {userDetail.role}
                                        </Badge>
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                        <Tabs defaultValue="info" className="flex-1 mt-6 overflow-hidden flex flex-col">
                            <TabsList className="mx-6 bg-secondary/50 p-1">
                                <TabsTrigger value="info" className="flex-1">Thông tin</TabsTrigger>
                                <TabsTrigger value="history" className="flex-1">Lịch sử thi</TabsTrigger>
                                <TabsTrigger value="violation" className="flex-1">Vi phạm</TabsTrigger>
                            </TabsList>

                            <ScrollArea className="flex-1 px-6 pt-4">
                                <TabsContent value="info" className="space-y-6 mt-0">
                                    <div className="grid gap-4">
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                                            <Mail className="h-4 w-4 text-primary/70" />
                                            <span className="text-foreground group-hover:text-primary transition-colors">{userDetail.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <Phone className="h-4 w-4 text-primary/70" />
                                            <span className="text-foreground">{userDetail.phone || "Chưa cập nhật"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <UserIcon className="h-4 w-4 text-primary/70" />
                                            <span className="text-foreground capitalize">{userDetail.gender || "Khác"} • Level {userDetail.jlptLevel}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-3">Thống kê hoạt động</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-secondary/30 p-4 rounded-xl border border-secondary/50">
                                                <span className="text-xs text-muted-foreground block mb-1">Lượt thi JLPT</span>
                                                <span className="text-2xl font-bold text-primary">{userDetail.totalJlptAttempts}</span>
                                            </div>
                                            <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/10">
                                                <span className="text-xs text-muted-foreground block mb-1">Số lần vi phạm</span>
                                                <span className="text-2xl font-bold text-destructive">{userDetail.violationCount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-3">Tiểu sử</h4>
                                        <p className="text-sm leading-relaxed text-muted-foreground italic">
                                            {userDetail.bio || "Người dùng này chưa có tiểu sử."}
                                        </p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="history" className="mt-0">
                                    {userDetail.testHistory && userDetail.testHistory.length > 0 ? (
                                        <div className="space-y-3">
                                            {userDetail.testHistory.map((test: any) => (
                                                <div key={test.id} className="p-3 bg-secondary/20 rounded-lg border border-secondary-border group hover:bg-secondary/30 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-sm font-semibold group-hover:text-primary transition-colors">#{test.id} - Đề thi #{test.testId}</span>
                                                        <Badge variant={test.isPassed ? "default" : "destructive"} className="text-[10px] py-0">
                                                            {test.isPassed ? "PASS" : "FAIL"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3" />
                                                            {test.completedAt && format(new Date(test.completedAt), "dd/MM/yyyy HH:mm")}
                                                        </div>
                                                        <span className="font-bold text-foreground">{test.totalScore} / 180</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center py-10 text-muted-foreground">Chưa có lịch sử thi.</p>
                                    )}
                                </TabsContent>

                                <TabsContent value="violation" className="mt-0">
                                    {userDetail.violationRecords && userDetail.violationRecords.length > 0 ? (
                                        <div className="space-y-4">
                                            {userDetail.violationRecords.map((v: any) => (
                                                <div key={v.id} className="flex gap-4 p-4 bg-destructive/5 rounded-xl border border-destructive/10">
                                                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-destructive uppercase tracking-wide">{v.action.replace("CHEATING_", "")}</p>
                                                        <p className="text-sm my-1 leading-snug">{v.newValues || "Phát hiện hành vi gian lận trong bài thi."}</p>
                                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(v.createdAt), "dd/MM/yyyy HH:mm")}
                                                            <Separator orientation="vertical" className="h-3" />
                                                            <span className="truncate">IP: {v.ipAddress}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 text-emerald-600 bg-emerald-50/50 rounded-2xl border border-dotted border-emerald-200">
                                            <ShieldCheck className="w-10 h-10 mb-2 opacity-50" />
                                            <p className="text-sm font-medium italic">Không có bản ghi vi phạm nào.</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>

                        <Separator />
                        <div className="p-6 bg-secondary/20">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Hoạt động cuối: {userDetail.lastActiveAt ? format(new Date(userDetail.lastActiveAt), "dd/MM/yyyy HH:mm") : "Không rõ"}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-destructive">Không thể tải thông tin người dùng.</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
