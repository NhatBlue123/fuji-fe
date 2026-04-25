"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";

interface UserOption {
  id: number;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface UserSearchComboboxProps {
  value: number | null;
  onChange: (userId: number | null) => void;
}

export function UserSearchCombobox({ value, onChange }: UserSearchComboboxProps) {
  const [users, setUsers] = React.useState<UserOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserOption | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const searchUsers = React.useCallback(async (keyword: string) => {
    if (!keyword || keyword.length < 2) {
      setUsers([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get("/users/me/all", {
        params: {
          keyword,
          page: 0,
          size: 20,
        },
      });

      if (response.data.success) {
        setUsers(response.data.data.content);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error("Search users error:", error);
      toast.error("Không thể tìm kiếm người dùng");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, searchUsers]);

  React.useEffect(() => {
    if (value === null) {
      setSelectedUser(null);
    }
  }, [value]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectUser = (user: UserOption) => {
    setSelectedUser(user);
    onChange(user.id);
    setSearch("");
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    onChange(null);
    setSearch("");
    inputRef.current?.focus();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {selectedUser ? (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.fullName} />
            <AvatarFallback>{getInitials(selectedUser.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedUser.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => {
                if (users.length > 0) setShowDropdown(true);
              }}
              className="pl-9"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>

          {showDropdown && (
            <div className="absolute z-50 w-full mt-2 bg-popover border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Đang tìm kiếm...
                </div>
              ) : users.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {search.length < 2
                    ? "Nhập ít nhất 2 ký tự để tìm kiếm"
                    : "Không tìm thấy người dùng"}
                </div>
              ) : (
                <div className="py-2">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                        <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
