"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useGetTeachersWithPermissionsQuery,
  useUpdateTeacherPermissionsMutation,
  usePromoteToTeacherMutation,
  useDemoteToStudentMutation,
  useUpdateUserRoleMutation,
  useGetAdminAllUsersQuery,
} from "@/store/services/permissionApi";
import type { TeacherWithPermissions } from "@/store/services/permissionApi";
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  getPermissionsByGroup,
} from "@/lib/permissions";
import { toast } from "sonner";
import {
  Search,
  Shield,
  Users,
  UserPlus,
  BookOpen,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Settings2,
  UserMinus,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

// ─── Tab type ─────────────────────────────────
type PageTab = "teachers" | "promote" | "admins";

// ─── Promote Dialog with permission checkboxes ─────────
function PromoteDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: number; fullName: string; username: string } | null;
  onConfirm: (permissions: string[]) => void;
  isLoading: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const togglePermission = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (group: string) => {
    const groupPerms = getPermissionsByGroup(group);
    const allChecked = groupPerms.every((p) => selected.has(p.key));
    setSelected((prev) => {
      const next = new Set(prev);
      groupPerms.forEach((p) => {
        if (allChecked) next.delete(p.key);
        else next.add(p.key);
      });
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(PERMISSIONS.map((p) => p.key)));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nâng cấp lên Giảng viên
          </DialogTitle>
          <DialogDescription>
            {user && (
              <>
                Chọn quyền hạn cho{" "}
                <span className="font-semibold">
                  {user.fullName || user.username}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Chọn tất cả
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Bỏ chọn tất cả
            </Button>
          </div>

          {PERMISSION_GROUPS.map((group) => {
            const perms = getPermissionsByGroup(group.key);
            const allChecked = perms.every((p) => selected.has(p.key));
            const someChecked =
              perms.some((p) => selected.has(p.key)) && !allChecked;

            return (
              <div key={group.key} className="space-y-2">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => toggleGroup(group.key)}
                >
                  <Checkbox
                    checked={allChecked}
                    ref={(el) => {
                      if (el) {
                        (el as unknown as HTMLButtonElement).dataset.state =
                          someChecked
                            ? "indeterminate"
                            : allChecked
                              ? "checked"
                              : "unchecked";
                      }
                    }}
                    onCheckedChange={() => toggleGroup(group.key)}
                  />
                  <Label className="font-semibold text-sm cursor-pointer">
                    {group.label}
                  </Label>
                </div>
                <div className="ml-6 grid gap-1.5">
                  {perms.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2 cursor-pointer text-sm py-0.5 hover:bg-muted/50 rounded px-1 -mx-1"
                    >
                      <Checkbox
                        checked={selected.has(perm.key)}
                        onCheckedChange={() => togglePermission(perm.key)}
                      />
                      <span>{perm.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {perm.description}
                      </span>
                    </label>
                  ))}
                </div>
                <Separator />
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={() => onConfirm(Array.from(selected))}
            disabled={isLoading || selected.size === 0}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Nâng cấp ({selected.size} quyền)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Permission Editor Dialog ─────────────────
function PermissionEditorDialog({
  open,
  onOpenChange,
  teacher,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: TeacherWithPermissions | null;
  onSave: (permissions: string[]) => void;
  isLoading: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(teacher?.permissions ?? []),
  );

  const teacherPerms = useMemo(() => teacher?.permissions ?? [], [teacher]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const togglePermission = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (group: string) => {
    const groupPerms = getPermissionsByGroup(group);
    const allChecked = groupPerms.every((p) => selected.has(p.key));
    setSelected((prev) => {
      const next = new Set(prev);
      groupPerms.forEach((p) => {
        if (allChecked) next.delete(p.key);
        else next.add(p.key);
      });
      return next;
    });
  };

  // Check if anything changed
  const hasChanges = useMemo(() => {
    const original = new Set(teacherPerms);
    if (selected.size !== original.size) return true;
    for (const key of selected) {
      if (!original.has(key)) return true;
    }
    return false;
  }, [selected, teacherPerms]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Quản lý quyền hạn
          </DialogTitle>
          <DialogDescription>
            {teacher && (
              <>
                Chỉnh sửa quyền hạn của giảng viên{" "}
                <span className="font-semibold">
                  {teacher.fullName || teacher.username}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {PERMISSION_GROUPS.map((group) => {
            const perms = getPermissionsByGroup(group.key);
            const allChecked = perms.every((p) => selected.has(p.key));
            const someChecked =
              perms.some((p) => selected.has(p.key)) && !allChecked;

            return (
              <div key={group.key} className="space-y-2">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => toggleGroup(group.key)}
                >
                  <Checkbox
                    checked={allChecked}
                    ref={(el) => {
                      if (el) {
                        (el as unknown as HTMLButtonElement).dataset.state =
                          someChecked
                            ? "indeterminate"
                            : allChecked
                              ? "checked"
                              : "unchecked";
                      }
                    }}
                    onCheckedChange={() => toggleGroup(group.key)}
                  />
                  <Label className="font-semibold text-sm cursor-pointer">
                    {group.label}
                  </Label>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {perms.filter((p) => selected.has(p.key)).length}/
                    {perms.length}
                  </span>
                </div>
                <div className="ml-6 grid gap-1.5">
                  {perms.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2 cursor-pointer text-sm py-0.5 hover:bg-muted/50 rounded px-1 -mx-1"
                    >
                      <Checkbox
                        checked={selected.has(perm.key)}
                        onCheckedChange={() => togglePermission(perm.key)}
                      />
                      <span>{perm.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {perm.description}
                      </span>
                    </label>
                  ))}
                </div>
                <Separator />
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={() => onSave(Array.from(selected))}
            disabled={isLoading || !hasChanges}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────
export default function RolesPage() {
  const [activeTab, setActiveTab] = useState<PageTab>("teachers");
  const [search, setSearch] = useState("");
  const [userPage, setUserPage] = useState(0);

  // Promote dialog
  const [promoteTarget, setPromoteTarget] = useState<{
    id: number;
    fullName: string;
    username: string;
  } | null>(null);
  const [adminTarget, setAdminTarget] = useState<{
    id: number;
    fullName: string;
    username: string;
    role: string;
  } | null>(null);

  // Permission editor dialog
  const [editingTeacher, setEditingTeacher] =
    useState<TeacherWithPermissions | null>(null);

  // Demote confirm dialog
  const [demoteTarget, setDemoteTarget] =
    useState<TeacherWithPermissions | null>(null);

  // API hooks
  const {
    data: teachers,
    isLoading: teachersLoading,
    isError: teachersError,
    refetch: refetchTeachers,
  } = useGetTeachersWithPermissionsQuery();

  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
    refetch: refetchUsers,
  } = useGetAdminAllUsersQuery({ page: userPage, size: 20 });

  const [updatePermissions, { isLoading: isUpdating }] =
    useUpdateTeacherPermissionsMutation();
  const [promote, { isLoading: isPromoting }] = usePromoteToTeacherMutation();
  const [demote, { isLoading: isDemoting }] = useDemoteToStudentMutation();
  const [updateUserRole, { isLoading: isUpdatingRole }] =
    useUpdateUserRoleMutation();

  // Filter students only (for promote tab)
  const students = useMemo(() => {
    if (!usersData?.content) return [];
    return usersData.content.filter((u) => {
      const isStudent = u.role === "STUDENT";
      const matchSearch =
        !search ||
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase());
      return isStudent && matchSearch;
    });
  }, [usersData, search]);

  const adminCandidates = useMemo(() => {
    if (!usersData?.content) return [];
    return usersData.content.filter((u) => {
      const canPromote = u.role !== "ADMIN";
      const matchSearch =
        !search ||
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase());
      return canPromote && matchSearch;
    });
  }, [usersData, search]);

  // Filter teachers by search
  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    if (!search) return teachers;
    return teachers.filter(
      (t) =>
        t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        t.email?.toLowerCase().includes(search.toLowerCase()) ||
        t.username?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [teachers, search]);

  // Handlers
  const handlePromote = useCallback(
    async (permissions: string[]) => {
      if (!promoteTarget) return;
      try {
        await promote({
          userId: promoteTarget.id,
          permissions,
        }).unwrap();
        toast.success(
          `Đã nâng cấp ${promoteTarget.fullName || promoteTarget.username} lên giảng viên`,
        );
        setPromoteTarget(null);
      } catch {
        toast.error("Nâng cấp giảng viên thất bại");
      }
    },
    [promoteTarget, promote],
  );

  const handleSavePermissions = useCallback(
    async (permissions: string[]) => {
      if (!editingTeacher) return;
      try {
        await updatePermissions({
          userId: editingTeacher.id,
          permissions,
        }).unwrap();
        toast.success(
          `Đã cập nhật quyền cho ${editingTeacher.fullName || editingTeacher.username}`,
        );
        setEditingTeacher(null);
      } catch {
        toast.error("Cập nhật quyền thất bại");
      }
    },
    [editingTeacher, updatePermissions],
  );

  const handleDemote = useCallback(async () => {
    if (!demoteTarget) return;
    try {
      await demote(demoteTarget.id).unwrap();
      toast.success(
        `Đã hạ cấp ${demoteTarget.fullName || demoteTarget.username} về học viên`,
      );
      setDemoteTarget(null);
    } catch {
      toast.error("Hạ cấp thất bại");
    }
  }, [demoteTarget, demote]);

  const handlePromoteAdmin = useCallback(async () => {
    if (!adminTarget) return;
    try {
      await updateUserRole({ userId: adminTarget.id, role: "ADMIN" }).unwrap();
      toast.success(
        `Đã nâng cấp ${adminTarget.fullName || adminTarget.username} lên admin`,
      );
      setAdminTarget(null);
    } catch {
      toast.error("Nâng cấp admin thất bại");
    }
  }, [adminTarget, updateUserRole]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Quản lý phân quyền
        </h1>
        <p className="text-muted-foreground mt-1">
          Phân quyền giảng viên và quản lý chức năng mà giảng viên được truy cập
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng giảng viên
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng học viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersData?.content?.filter((u) => u.role === "STUDENT").length ??
                "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chức năng</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{PERMISSIONS.length}</div>
            <p className="text-xs text-muted-foreground">quyền có thể phân</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "teachers" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("teachers");
            setSearch("");
          }}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Giảng viên & Quyền hạn
        </Button>
        <Button
          variant={activeTab === "promote" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("promote");
            setSearch("");
          }}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Nâng cấp giảng viên
        </Button>
        <Button
          variant={activeTab === "admins" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("admins");
            setSearch("");
          }}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          Nâng cấp admin
        </Button>
      </div>

      {/* ─── Tab: Teachers with permissions ─── */}
      {activeTab === "teachers" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Danh sách giảng viên</CardTitle>
            <CardDescription>
              Nhấn &quot;Chỉnh sửa quyền&quot; để thay đổi chức năng mà giảng
              viên được truy cập
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm giảng viên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchTeachers()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </div>

            {teachersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : teachersError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="text-muted-foreground">
                  Không thể tải danh sách giảng viên
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchTeachers()}
                >
                  Thử lại
                </Button>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">Chưa có giảng viên nào</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("promote")}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nâng cấp giảng viên
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    {/* Teacher info row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={teacher.avatarUrl || undefined}
                            alt={teacher.fullName || teacher.username}
                          />
                          <AvatarFallback>
                            {(teacher.fullName || teacher.username || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {teacher.fullName || teacher.username}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {teacher.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTeacher(teacher)}
                        >
                          <Settings2 className="h-4 w-4 mr-1.5" />
                          Chỉnh sửa quyền
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDemoteTarget(teacher)}
                        >
                          <UserMinus className="h-4 w-4 mr-1.5" />
                          Hạ cấp
                        </Button>
                      </div>
                    </div>

                    {/* Permissions grid */}
                    <div className="flex flex-wrap gap-1.5">
                      {teacher.permissions.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                          Chưa có quyền nào
                        </span>
                      ) : (
                        teacher.permissions.map((permKey) => {
                          const perm = PERMISSIONS.find(
                            (p) => p.key === permKey,
                          );
                          return (
                            <span
                              key={permKey}
                              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                            >
                              <Check className="h-3 w-3" />
                              {perm?.label || permKey}
                            </span>
                          );
                        })
                      )}
                    </div>

                    {/* Permission count summary */}
                    <div className="text-xs text-muted-foreground">
                      {teacher.permissions.length}/{PERMISSIONS.length} quyền
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Tab: Promote student to teacher ─── */}
      {activeTab === "promote" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Nâng cấp học viên lên giảng viên
            </CardTitle>
            <CardDescription>
              Chọn học viên và phân quyền chức năng tương ứng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm học viên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchUsers()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : usersError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="text-muted-foreground">
                  Không thể tải danh sách người dùng
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchUsers()}
                >
                  Thử lại
                </Button>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Users className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {search
                    ? "Không tìm thấy học viên phù hợp"
                    : "Không có học viên nào"}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Học viên</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((user, idx) => (
                        <TableRow key={user.id}>
                          <TableCell className="text-muted-foreground text-sm">
                            {userPage * 20 + idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={user.avatarUrl || undefined}
                                  alt={user.fullName || user.username}
                                />
                                <AvatarFallback className="text-xs">
                                  {(user.fullName || user.username || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">
                                  {user.fullName || user.username}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  @{user.username}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <span className="inline-flex items-center gap-1 text-xs">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="h-2 w-2 rounded-full bg-gray-400" />
                                Vô hiệu
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() =>
                                setPromoteTarget({
                                  id: user.id,
                                  fullName: user.fullName,
                                  username: user.username,
                                })
                              }
                            >
                              <UserPlus className="h-4 w-4 mr-1.5" />
                              Nâng cấp
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {usersData && usersData.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                      Trang {usersData.number + 1} / {usersData.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersData.first}
                        onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersData.last}
                        onClick={() => setUserPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Tab: Promote user to admin ─── */}
      {activeTab === "admins" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nâng cấp người dùng lên admin</CardTitle>
            <CardDescription>
              Admin có toàn bộ quyền hệ thống và không dùng permission giảng viên
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm người dùng..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchUsers()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : usersError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="text-muted-foreground">
                  Không thể tải danh sách người dùng
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchUsers()}
                >
                  Thử lại
                </Button>
              </div>
            ) : adminCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Shield className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {search
                    ? "Không tìm thấy người dùng phù hợp"
                    : "Không còn người dùng nào có thể nâng cấp"}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Người dùng</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Vai trò hiện tại</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminCandidates.map((user, idx) => (
                        <TableRow key={user.id}>
                          <TableCell className="text-muted-foreground text-sm">
                            {userPage * 20 + idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={user.avatarUrl || undefined}
                                  alt={user.fullName || user.username}
                                />
                                <AvatarFallback className="text-xs">
                                  {(user.fullName || user.username || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">
                                  {user.fullName || user.username}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  @{user.username}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setAdminTarget({
                                  id: user.id,
                                  fullName: user.fullName,
                                  username: user.username,
                                  role: user.role,
                                })
                              }
                            >
                              <Shield className="h-4 w-4 mr-1.5" />
                              Nâng cấp admin
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {usersData && usersData.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                      Trang {usersData.number + 1} / {usersData.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersData.first}
                        onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersData.last}
                        onClick={() => setUserPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <PromoteDialog
        open={!!promoteTarget}
        onOpenChange={(open) => {
          if (!open) setPromoteTarget(null);
        }}
        user={promoteTarget}
        onConfirm={handlePromote}
        isLoading={isPromoting}
      />

      <PermissionEditorDialog
        key={editingTeacher?.id ?? "no-teacher"}
        open={!!editingTeacher}
        onOpenChange={(open) => {
          if (!open) setEditingTeacher(null);
        }}
        teacher={editingTeacher}
        onSave={handleSavePermissions}
        isLoading={isUpdating}
      />

      {/* Promote Admin Confirm Dialog */}
      <Dialog
        open={!!adminTarget}
        onOpenChange={(open) => {
          if (!open) setAdminTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Nâng cấp admin
            </DialogTitle>
            <DialogDescription>
              {adminTarget && (
                <>
                  Bạn có chắc muốn nâng cấp{" "}
                  <span className="font-semibold">
                    {adminTarget.fullName || adminTarget.username}
                  </span>{" "}
                  từ {adminTarget.role} lên ADMIN?
                  <br />
                  <span className="text-xs mt-2 block text-muted-foreground">
                    Admin có toàn quyền hệ thống. Tài khoản này sẽ cần đăng
                    nhập lại để nhận role mới.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdminTarget(null)}
              disabled={isUpdatingRole}
            >
              Hủy
            </Button>
            <Button onClick={handlePromoteAdmin} disabled={isUpdatingRole}>
              {isUpdatingRole && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Xác nhận nâng cấp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demote Confirm Dialog */}
      <Dialog
        open={!!demoteTarget}
        onOpenChange={(open) => {
          if (!open) setDemoteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserMinus className="h-5 w-5" />
              Hạ cấp giảng viên
            </DialogTitle>
            <DialogDescription>
              {demoteTarget && (
                <>
                  Bạn có chắc muốn hạ cấp{" "}
                  <span className="font-semibold">
                    {demoteTarget.fullName || demoteTarget.username}
                  </span>{" "}
                  về học viên? Tất cả quyền hạn sẽ bị thu hồi.
                  <br />
                  <span className="text-xs mt-2 block text-muted-foreground">
                    Người dùng sẽ cần đăng nhập lại và không còn truy cập được
                    trang admin.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDemoteTarget(null)}
              disabled={isDemoting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDemote}
              disabled={isDemoting}
            >
              {isDemoting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận hạ cấp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
