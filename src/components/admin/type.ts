export interface Course {
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

export interface CourseFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Course, 'id'>) => void
  initialData?: Course | null
}

export interface CourseFormProps {
  onSubmit: (data: Omit<Course, 'id'>) => void
  onClose: () => void
  initialData?: Course | null
}