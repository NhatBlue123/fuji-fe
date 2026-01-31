import { z } from 'zod'

/**
 * Schema validate dữ liệu form khóa học
 * LƯU Ý:
 * - startDate, endDate là string (YYYY-MM-DD)
 * - So sánh ngày bằng new Date()
 */
export const courseSchema = z.object({
  title: z.string().min(1, 'Tên khóa học không được để trống'),

  description: z.string().min(1, 'Mô tả khóa học không được để trống'),

  // ❗ FIX enum: zod cần tuple, không nhận string[]
  level: z.enum(
    ['N5', 'N4', 'N3', 'N2', 'N1', 'BIZ'] as const,
    { message: 'Vui lòng chọn trình độ' }
  ),

  status: z.enum(
    ['Published', 'Draft'] as const,
    { message: 'Vui lòng chọn trạng thái' }
  ),

  image: z.string().min(1, 'Vui lòng chọn ảnh bìa'),

  students: z.number().min(0, 'Số học viên phải ≥ 0'),

  duration: z.string().min(1, 'Thời lượng không được để trống'),

  // ❗ DATE INPUT TRẢ STRING
  startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),

  endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),

  schedule: z.string().min(1, 'Lịch học không được để trống')
}).refine(
  data => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate']
  }
)

export type CourseFormData = z.infer<typeof courseSchema>
