'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { courseSchema, CourseFormData } from './schema'
import { CourseFormProps } from './type'

export default function CourseForm({ onSubmit, onClose, initialData }: CourseFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      level: (initialData?.level as any) || 'N5',
      status: (initialData?.status as any) || 'Draft',
      image: initialData?.image || '',
      students: initialData?.students || 0,
      duration: initialData?.duration || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : undefined,
      endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
      schedule: initialData?.schedule || ''
    }
  })

  const watchedImage = watch('image')

  useEffect(() => {
    if (watchedImage) {
      setImagePreview(watchedImage)
    }
  }, [watchedImage])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setValue('image', result)
      setImagePreview(result)
    }
    reader.readAsDataURL(file)
  }

  const onFormSubmit = (data: CourseFormData) => {
    onSubmit(data)
    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* ===== IMAGE ===== */}
      <section>
        <label className="block text-sm font-medium text-foreground mb-2">
          Ảnh bìa khóa học
        </label>

        {imagePreview && (
          <div className="mb-3 h-48 rounded-lg overflow-hidden border border-border">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <label className="flex items-center justify-center gap-2 px-4 py-6 rounded-lg border border-dashed border-border bg-muted/50 hover:bg-muted cursor-pointer transition">
          <span className="material-symbols-outlined text-primary">
            cloud_upload
          </span>
          <div className="text-center">
            <span className="text-sm font-medium text-foreground block">
              Chọn ảnh bìa
            </span>
            <span className="text-xs text-muted-foreground">
              Kéo và thả hoặc nhấp để chọn
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
        {errors.image && (
          <p className="text-sm text-destructive mt-1">{errors.image.message}</p>
        )}
      </section>

      {/* ===== BASIC INFO ===== */}
      <section className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Tên khóa học <span className="text-destructive">*</span>
          </label>
          <input
            {...register('title')}
            placeholder="VD: JLPT N5 Comprehensive"
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition"
          />
          {errors.title && (
            <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Mô tả khóa học <span className="text-destructive">*</span>
          </label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Nhập mô tả chi tiết về khóa học..."
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 resize-none transition"
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
          )}
        </div>
      </section>

      {/* ===== LEVEL & STATUS ===== */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Trình độ
          </label>
          <select
            {...register('level')}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition"
          >
            <option value="N5">N5 – Beginner</option>
            <option value="N4">N4 – Elementary</option>
            <option value="N3">N3 – Intermediate</option>
            <option value="N2">N2 – Upper</option>
            <option value="N1">N1 – Advanced</option>
            <option value="BIZ">BIZ – Business</option>
          </select>
          {errors.level && (
            <p className="text-sm text-destructive mt-1">{errors.level.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Trạng thái
          </label>
          <div className="flex gap-2">
            {(['Draft', 'Published'] as const).map(s => (
              <label key={s} className="flex-1">
                <input
                  type="radio"
                  {...register('status')}
                  value={s}
                  className="sr-only"
                />
                <div className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                  watch('status') === s
                    ? 'bg-primary text-primary-foreground border border-primary'
                    : 'bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground'
                }`}>
                  {s === 'Published' ? 'Đã xuất bản' : 'Bản nháp'}
                </div>
              </label>
            ))}
          </div>
          {errors.status && (
            <p className="text-sm text-destructive mt-1">{errors.status.message}</p>
          )}
        </div>
      </section>

      {/* ===== SCHEDULE ===== */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Lịch học</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ngày bắt đầu <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              {...register('startDate', { valueAsDate: true })}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition"
            />
            {errors.startDate && (
              <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ngày kết thúc <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              {...register('endDate', { valueAsDate: true })}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition"
            />
            {errors.endDate && (
              <p className="text-sm text-destructive mt-1">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Lịch học <span className="text-destructive">*</span>
          </label>
          <select
            {...register('schedule')}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition"
          >
            <option value="">Chọn lịch học</option>
            <option value="T2-T6: 18:00-20:00">T2-T6: 18:00-20:00</option>
            <option value="T7-CN: 09:00-11:00">T7-CN: 09:00-11:00</option>
            <option value="T2-T7: 19:00-21:00">T2-T7: 19:00-21:00</option>
            <option value="CN: 14:00-16:00">CN: 14:00-16:00</option>
            <option value="T3-T5: 17:00-19:00">T3-T5: 17:00-19:00</option>
          </select>
          {errors.schedule && (
            <p className="text-sm text-destructive mt-1">{errors.schedule.message}</p>
          )}
        </div>
      </section>

      {/* ===== ADDITIONAL INFO ===== */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Số học viên
          </label>
          <input
            type="number"
            {...register('students', { valueAsNumber: true })}
            placeholder="0"
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition"
          />
          {errors.students && (
            <p className="text-sm text-destructive mt-1">{errors.students.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Thời lượng (VD: 24h 30m)
          </label>
          <input
            type="text"
            {...register('duration')}
            placeholder="24h 30m"
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition"
          />
          {errors.duration && (
            <p className="text-sm text-destructive mt-1">{errors.duration.message}</p>
          )}
        </div>
      </section>

      {/* ===== SUBMIT ===== */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <button
          type="submit"
          disabled={!isValid}
          className="flex-1 py-2 rounded-md font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition"
        >
          {initialData ? 'Cập nhật khóa học' : 'Tạo khóa học'}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="px-6 py-2 rounded-md font-medium text-foreground bg-muted hover:bg-muted/80 transition"
        >
          Hủy
        </button>
      </div>
    </form>
  )
}