"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Eye,
    ShieldAlert,
    ShieldCheck,
    Lock,
    Unlock,
    AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "../ui/admin-component/admin-ui/button";

interface UserListItem {
    id: number;
    username: string;
    fullName: string;
    email: string;
    avatarUrl: string;
    role: string;
    isActive: boolean;
    totalJlptAttempts: number;
    violationCount: number;
    lastActiveAt: string;
}

interface UserTableProps {
    users: UserListItem[];
    onViewDetail: (id: number) => void;
    onToggleStatus: (id: number, isActive: boolean) => void;
    onUpdateRole: (id: number, role: string) => void;
}

export function UserTable({
    users,
    onViewDetail,
    onToggleStatus,
    onUpdateRole,
}: UserTableProps) {
    const getRoleBadge = (role: string) => {
        switch (role) {
            case "ADMIN":
                return (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
                        Admin
                    </Badge>
                );
            case "INSTRUCTOR":
                return (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                        Instructor
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="border-none">
                        Student
                    </Badge>
                );
        }
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                Hoạt động
            </Badge>
        ) : (
            <Badge variant="destructive" className="border-none">
                Bị khóa
            </Badge>
        );
    };

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[250px]">Người dùng</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-center">Số lần thi</TableHead>
                        <TableHead className="text-center">Vi phạm</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                            {user.fullName
                                                .split(" ")
                                                .pop()
                                                ?.charAt(0)
                                                .toUpperCase() || user.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-foreground">
                                            {user.fullName}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            @{user.username}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                                            {user.email}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                            <TableCell className="text-center font-medium">
                                {user.totalJlptAttempts}
                            </TableCell>
                            <TableCell className="text-center">
                                {user.violationCount > 0 ? (
                                    <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5 font-bold">
                                        <AlertCircle className="mr-1 h-3 w-3" />
                                        {user.violationCount}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground text-xs">0</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onViewDetail(user.id)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Xem chi tiết
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground py-1">Quản lý quyền</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onUpdateRole(user.id, user.role === "ADMIN" ? "STUDENT" : "ADMIN")}>
                                            {user.role === "ADMIN" ? (
                                                <><ShieldAlert className="mr-2 h-4 w-4 text-orange-500" /> Hạ quyền Admin</>
                                            ) : (
                                                <><ShieldCheck className="mr-2 h-4 w-4 text-primary" /> Nâng quyền Admin</>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onToggleStatus(user.id, !user.isActive)}>
                                            {user.isActive ? (
                                                <><Lock className="mr-2 h-4 w-4 text-destructive" /> Khóa tài khoản</>
                                            ) : (
                                                <><Unlock className="mr-2 h-4 w-4 text-emerald-600" /> Mở khóa</>
                                            )}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
