import type { UserSummaryDTO } from "@/types/course";

export interface CourseFinanceCourse {
  courseId: number;
  title: string;
  price: number;
  studentCount: number;
  isPublished: boolean;
  instructor: UserSummaryDTO;
  totalRevenue: number;
  totalTransactions: number;
  activeDiscounts: number;
  updatedAt: string;
}

export interface CourseFinanceSummary {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  totalTransactions: number;
  activeDiscounts: number;
}

export interface CourseDiscount {
  id: number;
  courseId: number;
  code: string;
  discountPercent: number;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  currentlyEffective: boolean;
  createdBy: UserSummaryDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetCourseFinanceCoursesParams {
  page?: number;
  size?: number;
  keyword?: string;
}

export interface UpdateCoursePricePayload {
  courseId: number;
  price: number;
}

export interface CreateCourseDiscountPayload {
  courseId: number;
  code: string;
  discountPercent: number;
  startAt?: string | null;
  endAt?: string | null;
  isActive?: boolean;
}

export interface UpdateCourseDiscountPayload {
  courseId: number;
  discountId: number;
  code?: string;
  discountPercent?: number;
  startAt?: string | null;
  endAt?: string | null;
  isActive?: boolean;
}

export interface DeleteCourseDiscountPayload {
  courseId: number;
  discountId: number;
}
