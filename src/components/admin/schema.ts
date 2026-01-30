import { z } from 'zod'

export const courseSchema = z.object({
  title: z.string().min(1, 'Tên khóa học không được để trống'),
  description: z.string().min(1, 'Mô tả khóa học không được để trống'),
  level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1', 'BIZ']).refine(val => val, {
    message: 'Vui lòng chọn trình độ'
  }),
  status: z.enum(['Published', 'Draft']).refine(val => val, {
    message: 'Vui lòng chọn trạng thái'
  }),
  image: z.string().min(1, 'Vui lòng chọn ảnh bìa'),
  students: z.number().min(0, 'Số học viên phải >= 0'),
  duration: z.string().min(1, 'Thời lượng không được để trống'),
  startDate: z.date().refine(val => val, {
    message: 'Vui lòng chọn ngày bắt đầu'
  }),
  endDate: z.date().refine(val => val, {
    message: 'Vui lòng chọn ngày kết thúc'
  }),
  schedule: z.string().min(1, 'Lịch học không được để trống')
}).refine((data) => data.endDate > data.startDate, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['endDate']
})

export type CourseFormData = z.infer<typeof courseSchema>