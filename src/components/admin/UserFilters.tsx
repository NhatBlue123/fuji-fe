"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface UserFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    role: string;
    onRoleChange: (value: string) => void;
    status: string;
    onStatusChange: (value: string) => void;
}

export function UserFilters({
    search,
    onSearchChange,
    role,
    onRoleChange,
    status,
    onStatusChange,
}: UserFiltersProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Tìm user, email, tên..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="flex items-center gap-3">
                <Select value={role} onValueChange={onRoleChange}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                        <SelectItem value="STUDENT">Học viên</SelectItem>
                        <SelectItem value="INSTRUCTOR">Giảng viên</SelectItem>
                        <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={status} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                        <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                        <SelectItem value="INACTIVE">Đã khóa</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
