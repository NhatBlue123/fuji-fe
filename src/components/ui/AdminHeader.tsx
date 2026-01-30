'use client'

import { useState, useEffect } from 'react'

export default function AdminHeader({ onAddClick }: { onAddClick?: () => void }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light'
    setIsDark(theme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const levels = ['N1', 'N2', 'N3', 'N4', 'N5']

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="hover:text-text-main cursor-pointer transition-colors">Dashboard</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-text-main font-medium">Courses</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-md hover:bg-accent border border-border flex items-center justify-center text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors relative">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary border-2 border-background"></span>
        </button>
        <button className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors">
          <span className="material-symbols-outlined text-[20px]">help</span>
        </button>
      </div>
    </header>
  )
}