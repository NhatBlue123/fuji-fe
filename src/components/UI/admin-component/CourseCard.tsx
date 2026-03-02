'use client'

interface CourseCardProps {
  title: string
  description: string
  level: string
  status: 'published' | 'draft'
  students: number
  duration: string
  image: string
  actionLabel: string
}

export function CourseCard({
  title,
  description,
  level,
  status,
  students,
  duration,
  image,
  actionLabel
}: CourseCardProps) {
  const levelColors: Record<string, string> = {
    N5: 'bg-blue-600 text-white',
    N4: 'bg-emerald-600 text-white',
    N3: 'bg-purple-600 text-white',
    N2: 'bg-indigo-500 text-white',
    BIZ: 'bg-blue-500 text-white',
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-200">

      {/* IMAGE */}
      <div className="relative aspect-video overflow-hidden rounded-t-xl">
        <img
          src={image}
          alt={title}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${status === 'draft'
              ? 'grayscale opacity-80 hover:grayscale-0 hover:opacity-100'
              : ''
            }`}
        />

        {/* STATUS BADGE – LUÔN TRẮNG */}
        <span className="absolute top-3 right-3 rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-black shadow">
          {status}
        </span>

        {/* LEVEL BADGE */}
        <span
          className={`absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-xs font-bold shadow ${levelColors[level] || 'bg-gray-500 text-white'
            }`}
        >
          {level}
        </span>
      </div>

      {/* CONTENT */}
      <div className="space-y-3 p-5">
        <div className="space-y-1">
          <h3 className="
            text-lg font-semibold leading-tight transition-colors
            text-gray-900 dark:text-gray-100
            group-hover:text-blue-600 dark:group-hover:text-blue-400
          ">
            {title}
          </h3>

          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>

        <div className="flex gap-4 border-t border-gray-200 dark:border-gray-700 pt-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">group</span>
            {students} Students
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {duration}
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 px-4 pb-4">
        <button className="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition">
          {actionLabel}
        </button>

        <button className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 transition">
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
    </div>
  )
}
