'use client'

import Modal from '@/components/ui/Modal'
import CourseForm from './CourseForm'

interface Course {
  id: number
  title: string
  description: string
  level: string
  status: 'Published' | 'Draft'
  image: string
  students?: number
  duration?: string
  startDate?: Date
  endDate?: Date
  schedule?: string
}

interface CourseFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Course, 'id'>) => void
  initialData?: Course | null
}

export default function CourseFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: CourseFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
      size="xl"
    >
      <CourseForm
        onSubmit={(data: any) => {
          onSubmit(data)
          onClose()
        }}
        onClose={onClose}
        initialData={initialData}
      />
    </Modal>
  )
}