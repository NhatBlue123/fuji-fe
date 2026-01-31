export interface Course {
  id: number
  title: string
  description: string
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'BIZ'
  status: 'Published' | 'Draft'
  image: string
  students: number
  duration: string
  startDate: string
  endDate: string
  schedule: string
}

export interface CourseFormProps {
  mode: 'create' | 'edit'
  initialData?: Course | null
  onSuccess: () => void
}

export interface CourseFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Course, 'id'>) => void
  initialData?: Course | null
}
