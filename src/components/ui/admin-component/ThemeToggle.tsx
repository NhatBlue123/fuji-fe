'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem('theme')
        const isDarkMode = saved === 'dark'
        setIsDark(isDarkMode)

        document.documentElement.classList.toggle('dark', isDarkMode)
    }, [])

    const toggleTheme = () => {
        const next = !isDark
        setIsDark(next)

        document.documentElement.classList.toggle('dark', next)
        localStorage.setItem('theme', next ? 'dark' : 'light')
    }

    return (
        <button
            onClick={toggleTheme}
            className="
        flex items-center gap-3 w-full px-3 py-2 rounded-lg
        text-sm font-medium transition-colors
        hover:bg-gray-100 dark:hover:bg-gray-800
        text-gray-700 dark:text-gray-200
      "
        >
            <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'dark_mode' : 'light_mode'}
            </span>

            {!collapsed && (
                <span>
                    {isDark ? 'Dark mode' : 'Light mode'}
                </span>
            )}
        </button>
    )
}
