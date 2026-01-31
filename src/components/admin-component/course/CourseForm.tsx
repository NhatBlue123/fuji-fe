'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { courseSchema, CourseFormData } from './schema'
import { CourseFormProps } from './type'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export default function CourseForm({ mode, initialData, onSuccess }: CourseFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description,
      level: initialData.level as any,
      status: initialData.status,
      image: initialData.image,
      students: initialData.students,
      duration: initialData.duration,
      startDate: initialData.startDate,
      endDate: initialData.endDate,
      schedule: initialData.schedule
    } : {
      title: '',
      description: '',
      level: 'N5',
      status: 'Draft',
      image: '',
      students: 0,
      duration: '',
      startDate: '',
      endDate: '',
      schedule: ''
    }
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  const onSubmit = async (data: CourseFormData) => {
    setIsLoading(true)
    try {
      const url = mode === 'create' ? '/api/admin/courses' : `/api/admin/courses/${initialData?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        onSuccess()
      } else {
        console.error('Failed to save course')
      }
    } catch (error) {
      console.error('Error saving course:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tên khóa học</label>
          <Input {...register('title')} placeholder="Nhập tên khóa học" />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Trình độ</label>
          <Select onValueChange={(value) => setValue('level', value as any)} defaultValue={watch('level')}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn trình độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="N5">N5</SelectItem>
              <SelectItem value="N4">N4</SelectItem>
              <SelectItem value="N3">N3</SelectItem>
              <SelectItem value="N2">N2</SelectItem>
              <SelectItem value="N1">N1</SelectItem>
              <SelectItem value="BIZ">BIZ</SelectItem>
            </SelectContent>
          </Select>
          {errors.level && <p className="text-sm text-red-500">{errors.level.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Mô tả</label>
        <Textarea {...register('description')} placeholder="Nhập mô tả khóa học" rows={3} />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Trạng thái</label>
          <Select onValueChange={(value) => setValue('status', value as any)} defaultValue={watch('status')}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Số học viên</label>
          <Input {...register('students', { valueAsNumber: true })} type="number" placeholder="0" />
          {errors.students && <p className="text-sm text-red-500">{errors.students.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ảnh bìa</label>
        <Input {...register('image')} placeholder="URL ảnh" />
        {errors.image && <p className="text-sm text-red-500">{errors.image.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Thời lượng</label>
          <Input {...register('duration')} placeholder="Ví dụ: 3 tháng" />
          {errors.duration && <p className="text-sm text-red-500">{errors.duration.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Lịch học</label>
          <Input {...register('schedule')} placeholder="Ví dụ: T2-T6 19:00-21:00" />
          {errors.schedule && <p className="text-sm text-red-500">{errors.schedule.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Ngày bắt đầu</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(new Date(startDate), "PPP") : "Chọn ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate ? new Date(startDate) : undefined}
                onSelect={(date) => setValue('startDate', date ? format(date, 'yyyy-MM-dd') : '')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Ngày kết thúc</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(new Date(endDate), "PPP") : "Chọn ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate ? new Date(endDate) : undefined}
                onSelect={(date) => setValue('endDate', date ? format(date, 'yyyy-MM-dd') : '')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset(initialData ?? undefined)}
        >
          Reset
        </Button>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : mode === 'create' ? 'Thêm khóa học' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  )
}