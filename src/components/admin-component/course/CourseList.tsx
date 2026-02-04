// CourseList.tsx
'use client'

import { Course } from './type'

export default function CourseList({
  courses,
  onEdit,
  onDelete,
}: {
  courses: Course[]
  onEdit: (course: Course) => void
  onDelete: (id: number) => void
}) {
  const getLevelColor = (level: Course['level']) => {
    const colors = {
      N5: 'bg-orange-500',
      N4: 'bg-emerald-600',
      N3: 'bg-purple-600',
      N2: 'bg-indigo-500',
      N1: 'bg-red-600',
      BIZ: 'bg-blue-500',
    }
    return colors[level]
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          Không tìm thấy khóa học nào
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {courses.map(course => (
        <div key={course.id} className="bg-card rounded-xl border shadow-sm">
          {/* IMAGE */}
          <div className="aspect-video relative overflow-hidden rounded-t-xl">
            <img src={course.image} className="w-full h-full object-cover" />
            <div className={`absolute bottom-3 left-3 ${getLevelColor(course.level)} text-white text-xs px-2 py-1 rounded`}>
              {course.level}
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-lg">{course.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-2 p-4 pt-0">
            <button
              onClick={() => onEdit(course)}
              className="flex-1 border rounded-md h-9"
            >
              Chỉnh sửa
            </button>
            <button
              onClick={() => onDelete(course.id)}
              className="h-9 w-9 text-destructive"
            >
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
