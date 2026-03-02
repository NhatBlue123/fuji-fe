import Link from "next/link"

export default function CourseHeader() {
  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 top-0 z-40">
      <div className="h-full px-8 flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link
            href="/(admin)/dashboard"
            className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            Dashboard
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>
          <span className="text-blue-700 dark:text-blue-400 font-medium">
            Courses
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
          </button>
          <button className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
            <span className="material-symbols-outlined text-[20px]">
              help
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
