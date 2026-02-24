'use client'

import { useState } from 'react'
import { CourseCard } from './CourseCard'

type Tab = 'all' | 'published' | 'draft'
const courses = [
    {
        title: 'JLPT N5 Comprehensive',
        description: 'Complete beginner guide to Japanese grammar, vocabulary and kanji.',
        level: 'N5',
        status: 'published' as const,
        students: 1234,
        duration: '24h 30m',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYv3WLw90mkTueFwZZp5Hebe4xq1J-vBOkxUkvbf7tgEVh-R2Z44GxaceXxsOAeO1AZNEAfwcX0zAX-512EGkpPsYQcqOJZEv0jRJc46njizAemH9IbnDHOylg1xAKdBZPiOtHxA4u4sKu5KtnSfEzB7RnhkcFJPqHdblzNlecpLEPJxzxEpFlfsEesUfezQ6UR7s1vuIuTyfBbfn-yCawNgc6IjEHKNUFHDixshpWZ5veTvqE6BDkSikcD4cbrRm5XYqEeb80G4E',
        actionLabel: 'Chỉnh sửa'
    },
    {
        title: 'Kanji Mastery N3',
        description: 'Intermediate Kanji characters with focus on reading and writing.',
        level: 'N3',
        status: 'draft' as const,
        students: 0,
        duration: '--h --m',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWHOal0kvXGMu-t5vp-mlglyYNfjoz1NDYHrZWYA8L69lvcR64f67uUAl71T8cjjg0jvb1hTbIvfEkB0FzsMxCBe7cTcGR3vIpnaEHbwCFePa9vpuAqaLtAZ5M2b7wf9m4WKeX_SpbMM2iVJR7tvZhwybBGuzUFY8CnxWxEmI0pok6G7Z3zfA5ZPwg1SiRWimlX1fmAbyS5uaBoH7wipxYWKzI2ChKUcqI7WuxDh1B3MEieRdxXYBYFjjoE6fbNoMYFpmniJOxeME',
        actionLabel: 'Tiếp tục soạn'
    },
    {
        title: 'Listening Practice N2',
        description: 'Advanced listening comprehension for business and daily life scenarios.',
        level: 'N2',
        status: 'published' as const,
        students: 892,
        duration: '18h 15m',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFsXLT3n_e_G88vVqTHlxkhS2JmrGG4seSCpwsYINOGN9v0Jad0vcezfekIsnLn1DFZWNqwikuMOURYzYfqFiFfC7aFBXFqoMoZ32rPYchVGfUN45E-YGENi58RgKJ6lG5M-YNaX4JGUyq-N0YPE9lebxMGLO_dqQj2scONdouTAmhVyBqIKN_fE0bY9y4PrLRKtBDC7SOOlnqU0B9zvvU0rqyEltETcwZqDS91Em2h3q5Cy42O4GmzJeuj50d-VmEblLNLH7OO-w',
        actionLabel: 'Chỉnh sửa'
    },
    {
        title: 'Business Japanese',
        description: 'Learn Keigo and formal business etiquette for working in Japan.',
        level: 'BIZ',
        status: 'draft' as const,
        students: 0,
        duration: '--h --m',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpedYxiLSuVEdzb7lPI2O3OosGHeVwrv7Dq_64dw3VOK96pG5m9mULyMKQ6Ae5MtvEEuORI7QcEMPBSvHRQvfT1ndIDYH-2Ns2ijEeGn3FMWzJ2lhkRnwe3PWnMQQxa3Vad0I_Wmkw0EFLBnUzs9eTIaulTm1jORkCKLx_G8hV7eksIC82vd5lVlZqD9wb_iPR9GTSQWjbxNSJQIWP3FaVC9yhL3hsCFVD4P0-hM5R5QOKDifjnAM1UxkYygS0riOBNd47anqyahw',
        actionLabel: 'Tiếp tục soạn'
    },
    {
        title: 'Grammar Foundation N4',
        description: 'Essential grammar structures to bridge beginner and intermediate levels.',
        level: 'N4',
        status: 'published' as const,
        students: 542,
        duration: '12h 45m',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmU0A1Ib-Ts_fd2dN4lB_Gm8JqvWfatxRSQPeQM_ulhnvmj-aPEST_5bv140w2yVllpdAHNGLMW060KKfic4pjsORsMo0Lkv3kHNp0hdbe6-oRhQWf7wGiWfgPwykwLYvp_-rCAIa-fre6CYGFjGxUJVyr79Mv9lsG9gFZX22Xu92Q0uD5ZcMBb2A8nsoWnvSe3Iq_qYWbrbnuYW3PtBQxiaLur4_Nf8qIlh_c9DWaWj9-j0jDz1E5vtLvUTJA8bxR6wPRWoYYlns',
        actionLabel: 'Chỉnh sửa'
    }
]

export function CourseGrid() {
    const [activeTab, setActiveTab] = useState<Tab>('all')

    const filteredCourses = courses.filter(course => {
        if (activeTab === 'all') return true
        if (activeTab === 'published') return course.status === 'published'
        if (activeTab === 'draft') return course.status === 'draft'
        return true
    })

    const tabClass = (tab: Tab) =>
        activeTab === tab
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted'

    return (
        <div className="space-y-6 pt-6 px-6">

            {/* Header */}
            <div>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground mb-1">
                        Quản lý khóa học
                    </h1>

                    <button className="inline-flex items-center gap-2 rounded-md
                        bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800
                        h-10 px-4 text-sm font-medium shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Tạo khóa học
                    </button>
                </div>

                <p className="text-sm text-muted-foreground mt-1">
                    Manage your curriculum and track student progress.
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">

                {/* Tabs */}
                <div className="inline-flex h-9 items-center rounded-md bg-muted p-1 text-sm">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`rounded px-3 py-1 transition ${tabClass('all')}`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setActiveTab('published')}
                        className={`rounded px-3 py-1 transition ${tabClass('published')}`}
                    >
                        Đã xuất bản
                    </button>
                    <button
                        onClick={() => setActiveTab('draft')}
                        className={`rounded px-3 py-1 transition ${tabClass('draft')}`}
                    >
                        Bản nháp
                    </button>
                </div>

                {/* Search */}
                <div className="relative w-64">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2
                    text-muted-foreground material-symbols-outlined text-[18px]">
                        search
                    </span>

                    <input
                        className="
                    h-9 w-full rounded-md
                    border border-border
                    bg-background dark:bg-gray-800
                    pl-12 pr-3 text-sm
                    text-foreground dark:text-white
                    placeholder:text-muted-foreground dark:placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-primary
                    "
                        placeholder="Search courses..."
                    />
                </div>

            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.map((course, index) => (
                    <CourseCard key={index} {...course} />
                ))}
            </div>
        </div>
    )
}
