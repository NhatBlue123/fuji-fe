'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light'
    setIsDark(theme === 'dark')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }))
  }

  const isActive = (path: string) => {
    const normalizedPathname = pathname.replace(/\/$/, '') // Remove trailing slash
    const normalizedPath = path.replace(/\/$/, '') // Remove trailing slash
    return normalizedPathname === normalizedPath || normalizedPathname.startsWith(normalizedPath + '/')
  }

  const menuItems = [
    {
      href: '/admin',
      icon: 'dashboard',
      label: 'Dashboard'
    },
    {
      href: '/admin/course-admin',
      icon: 'school',
      label: 'Quản lý khóa học'
    },
    {
      href: '/admin/users',
      icon: 'group',
      label: 'Quản lý người dùng'
    },
    {
      href: '/admin/settings',
      icon: 'settings',
      label: 'Cài đặt'
    }
  ]

  return (
    <div className="min-h-screen flex bg-background text-text-main">
      <aside className="w-64 h-screen bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-foreground text-2xl">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">FUJI Learning</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <div
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                isActive(item.href)
                  ? 'bg-blue-500 text-white shadow-sm font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-blue-700 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary-foreground text-sm">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Administrator</p>
              <p className="text-xs text-muted-foreground truncate">admin@fuji.com</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hover:text-text-main cursor-pointer transition-colors">Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-text-main font-medium">Courses</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-md hover:bg-accent dark:hover:bg-accent border border-border flex items-center justify-center text-foreground transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button className="h-9 w-9 rounded-full hover:bg-secondary dark:hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary border-2 border-background"></span>
            </button>
            <button className="h-9 w-9 rounded-full hover:bg-secondary dark:hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors">
              <span className="material-symbols-outlined text-[20px]">help</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}