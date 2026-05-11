/**
 * Permission system definitions
 * Matches backend TeacherPermissionService.ALL_PERMISSION_KEYS
 */

export interface PermissionDef {
  key: string;
  label: string;
  description: string;
  group: string;
}

export const PERMISSION_GROUPS = [
  { key: "general", label: "Tổng quan" },
  { key: "booking", label: "Booking & lịch dạy" },
  { key: "course", label: "Khóa học" },
  { key: "finance", label: "Doanh thu & ví" },
] as const;

export const PERMISSIONS: PermissionDef[] = [
  // General
  {
    key: "DASHBOARD_VIEW",
    label: "Xem dashboard",
    description: "Truy cập dashboard giảng viên",
    group: "general",
  },
  {
    key: "BOOKING_VIEW",
    label: "Xem booking",
    description: "Truy cập lịch dạy và booking của chính mình",
    group: "booking",
  },
  // Course
  {
    key: "COURSE_VIEW",
    label: "Xem khóa học",
    description: "Xem danh sách và chi tiết khóa học",
    group: "course",
  },
  {
    key: "COURSE_CREATE",
    label: "Tạo khóa học",
    description: "Tạo khóa học mới",
    group: "course",
  },
  {
    key: "COURSE_EDIT",
    label: "Sửa khóa học",
    description: "Chỉnh sửa thông tin khóa học",
    group: "course",
  },
  {
    key: "COURSE_DELETE",
    label: "Xóa khóa học",
    description: "Xóa khóa học khỏi hệ thống",
    group: "course",
  },
  {
    key: "COURSE_FINANCE_VIEW",
    label: "Xem doanh thu khóa học",
    description: "Xem doanh thu khóa học của chính mình",
    group: "finance",
  },
  {
    key: "WALLET_VIEW",
    label: "Xem ví",
    description: "Truy cập ví và yêu cầu rút tiền của chính mình trong admin workspace",
    group: "finance",
  },
];

/**
 * Map permission key -> sidebar route
 */
export const PERMISSION_ROUTE_MAP: Record<string, string> = {
  DASHBOARD_VIEW: "/admin/teacher-dashboard",
  BOOKING_VIEW: "/admin/teacher-schedules",
  COURSE_VIEW: "/admin/courses",
  COURSE_FINANCE_VIEW: "/admin/courses/finance/teacher",
  WALLET_VIEW: "/admin/my-wallet",
};

/**
 * Map route -> required VIEW permission
 */
export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  "/admin/teacher-dashboard": "DASHBOARD_VIEW",
  "/admin/teacher-schedules": "BOOKING_VIEW",
  "/admin/teacher-schedules/teaching-schedule": "BOOKING_VIEW",
  "/admin/teacher-schedules/create-slot": "BOOKING_VIEW",
  "/admin/courses": "COURSE_VIEW",
  "/admin/courses/finance": "ADMIN_ONLY",
  "/admin/courses/finance/teacher": "COURSE_FINANCE_VIEW",
  "/admin/my-wallet": "WALLET_VIEW",
  "/admin/my-withdraw": "WALLET_VIEW",
};

export function getPermissionsByGroup(group: string): PermissionDef[] {
  return PERMISSIONS.filter((p) => p.group === group);
}
