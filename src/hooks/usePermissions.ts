"use client";

import { useAuth } from "@/store/hooks";
import { useGetMyPermissionsQuery } from "@/store/services/permissionApi";
import { ROUTE_PERMISSION_MAP } from "@/lib/permissions";

/**
 * Hook kiểm tra quyền của user hiện tại.
 * - ADMIN: có tất cả quyền
 * - INSTRUCTOR: kiểm tra theo danh sách permissions từ server
 * - STUDENT: không có quyền admin nào
 */
export function usePermissions() {
  const { user, isAdmin, roles } = useAuth();
  const isInstructor =
    roles.includes("INSTRUCTOR") ||
    roles.includes("ROLE_INSTRUCTOR") ||
    user?.role === "INSTRUCTOR";

  const { data: permissions = [], isLoading } = useGetMyPermissionsQuery(
    undefined,
    {
      skip: !isInstructor, // Chỉ fetch khi là INSTRUCTOR
    },
  );

  /**
   * Kiểm tra user có permission cụ thể không
   */
  const hasPermission = (permissionKey: string): boolean => {
    if (isAdmin) return true;
    if (!isInstructor) return false;
    return permissions.includes(permissionKey);
  };

  /**
   * Kiểm tra user có quyền truy cập route admin cụ thể không
   */
  const canAccessRoute = (route: string): boolean => {
    if (isAdmin) return true;
    if (!isInstructor) return false;

    // Kiểm tra exact match
    const permKey = ROUTE_PERMISSION_MAP[route];
    if (permKey) return permissions.includes(permKey);

    // Kiểm tra parent route (e.g., /admin/courses/123 → /admin/courses)
    for (const [routePattern, perm] of Object.entries(ROUTE_PERMISSION_MAP)) {
      if (route.startsWith(routePattern + "/")) {
        return permissions.includes(perm);
      }
    }

    return false;
  };

  /**
   * Kiểm tra user có bất kỳ quyền admin nào không (để hiện admin layout)
   */
  const hasAnyAdminAccess = isAdmin || (isInstructor && permissions.length > 0);

  return {
    permissions,
    isLoading,
    isAdmin,
    isInstructor,
    hasPermission,
    canAccessRoute,
    hasAnyAdminAccess,
  };
}
