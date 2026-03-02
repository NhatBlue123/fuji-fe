'use client'

import { useSidebar } from './SidebarContext'
import clsx from 'clsx'
import ThemeToggle from './ThemeToggle'

export default function CourseAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarOpen, toggleSidebar } = useSidebar()

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={clsx(
          'border-r border-border bg-background flex flex-col transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo + toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">mountain_flag</span>
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg text-foreground whitespace-nowrap">
                FUJI Admin
              </span>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-md hover:bg-gray-100 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">
              menu
            </span>
          </button>
        </div>

        {/* MENU (scroll được) */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
          {[
            { icon: 'grid_view', label: 'Dashboard' },
            { icon: 'school', label: 'Courses', active: true },
            { icon: 'group', label: 'Students' },
            { icon: 'bar_chart', label: 'Analytics' },
            { icon: 'settings', label: 'Settings' },
          ].map((item, i) => (
            <a
              key={i}
              href="#"
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                item.active
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'

              )}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className="text-sm font-medium">
                  {item.label}
                </span>
              )}
            </a>
          ))}
        </nav>{/* Theme Toggle */}
        <ThemeToggle collapsed={!sidebarOpen} />
        <div className=" border-gray-200 dark:border-gray-700  space-y-2"></div>



        {/* User */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted border-border flex items-center justify-center overflow-hidden">
              <img
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6iW6AvKO-qLiW1CBN9PiIkNNOCye3i0-IcSRBERvCSHW3Rx38fQXjcKlzVw7RwOBAQpytM8gZ-gpWRSg9C_tuJSHjxXAqPn8tVCGeJpbta7QeDZnbyx3O6rRsO8KndxwmT4aSubbqa2kNRNtPo_54QaR8NIPa-0wENHptpY0EbDWRHg-D-x8WVu_VrsbuC-lwSnp9HIrcvTKoA_AlCYPzLSsSkGqDhL8z5Z2xFnZ8T8kpPMMXyoqYTBNupA8TBlcz1qYSKBYVlTQ"
              />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <p className="text-sm font-medium text-foreground">Minh Anh</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col bg-background text-foreground overflow-hidden">
        {/* HEADER */}
        <header
          className="
      h-16 flex items-center justify-between
      px-6
      border-b border-border
      bg-background
      sticky top-0 z-30
    "
        >
          {/* Breadcrumb */}
          <div className="text-sm text-muted-foreground">
            Dashboard <span className="mx-2">›</span> Courses
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-muted-foreground">
              notifications
            </span>
            <span className="material-symbols-outlined text-muted-foreground">
              help
            </span>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </main>
      </div>

    </div>
  )
}
