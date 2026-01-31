'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import CourseForm from './CourseForm'
import { Course } from './type'

interface CourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: Course | null
  onSuccess: () => void
}

export default function CourseModal({
  open,
  onOpenChange,
  mode,
  initialData,
  onSuccess
}: CourseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm khóa học' : 'Chỉnh sửa khóa học'}
          </DialogTitle>
        </DialogHeader>
        <CourseForm
          mode={mode}
          initialData={initialData}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
