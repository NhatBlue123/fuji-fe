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
  { key: "course", label: "Khóa học" },
  { key: "flashcard", label: "Flashcard" },
  { key: "jlpt", label: "Đề thi JLPT" },
  { key: "notification", label: "Thông báo" },
] as const;

export const PERMISSIONS: PermissionDef[] = [
  // General
  {
    key: "DASHBOARD_VIEW",
    label: "Xem Dashboard",
    description: "Truy cập trang tổng quan admin",
    group: "general",
  },
  {
    key: "ANALYTICS_VIEW",
    label: "Xem thống kê",
    description: "Truy cập trang thống kê và phân tích",
    group: "general",
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
  // Flashcard
  {
    key: "FLASHCARD_VIEW",
    label: "Xem flashcard",
    description: "Xem danh sách và chi tiết flashcard",
    group: "flashcard",
  },
  {
    key: "FLASHCARD_CREATE",
    label: "Tạo flashcard",
    description: "Tạo flashcard mới",
    group: "flashcard",
  },
  {
    key: "FLASHCARD_EDIT",
    label: "Sửa flashcard",
    description: "Chỉnh sửa flashcard",
    group: "flashcard",
  },
  {
    key: "FLASHCARD_DELETE",
    label: "Xóa flashcard",
    description: "Xóa flashcard khỏi hệ thống",
    group: "flashcard",
  },
  // JLPT
  {
    key: "JLPT_VIEW",
    label: "Xem đề thi",
    description: "Xem danh sách và chi tiết đề thi JLPT",
    group: "jlpt",
  },
  {
    key: "JLPT_CREATE",
    label: "Tạo đề thi",
    description: "Tạo đề thi JLPT mới",
    group: "jlpt",
  },
  {
    key: "JLPT_EDIT",
    label: "Sửa đề thi",
    description: "Chỉnh sửa đề thi JLPT",
    group: "jlpt",
  },
  {
    key: "JLPT_DELETE",
    label: "Xóa đề thi",
    description: "Xóa đề thi JLPT",
    group: "jlpt",
  },
  // Notification
  {
    key: "NOTIFICATION_VIEW",
    label: "Xem thông báo",
    description: "Truy cập trang quản lý thông báo",
    group: "notification",
  },
];

/**
 * Map permission key -> sidebar route
 */
export const PERMISSION_ROUTE_MAP: Record<string, string> = {
  DASHBOARD_VIEW: "/admin",
  ANALYTICS_VIEW: "/admin/analytics",
  COURSE_VIEW: "/admin/courses",
  FLASHCARD_VIEW: "/admin/flashcard",
  JLPT_VIEW: "/admin/jlpt-tests",
  NOTIFICATION_VIEW: "/admin/notifications",
};

/**
 * Map route -> required VIEW permission
 */
export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  "/admin": "DASHBOARD_VIEW",
  "/admin/analytics": "ANALYTICS_VIEW",
  "/admin/courses": "COURSE_VIEW",
  "/admin/flashcard": "FLASHCARD_VIEW",
  "/admin/jlpt-tests": "JLPT_VIEW",
  "/admin/notifications": "NOTIFICATION_VIEW",
};

export function getPermissionsByGroup(group: string): PermissionDef[] {
  return PERMISSIONS.filter((p) => p.group === group);
}
