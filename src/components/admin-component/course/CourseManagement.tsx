'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import CourseModal from './CourseModal'
import { Course } from './type'
import { Button } from '@/components/ui/button'

const MOCK_COURSES: Course[] = [
    {
        id: 1,
        title: 'JLPT N5 Comprehensive',
        description: 'Complete beginner guide to Japanese grammar, vocabulary and kanji.',
        level: 'N5' as const,
        status: 'Published' as const,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYv3WLw90mkTueFwZZp5Hebe4xq1J-vBOkxUkvbf7tgEVh-R2Z44GxaceXxsOAeO1AZNEAfwcX0zAX-512EGkpPsYQcqOJZEv0jRJc46njizAemH9IbnDHOylg1xAKdBZPiOtHxA4u4sKu5KtnSfEzB7RnhkcFJPqHdblzNlecpLEPJxzxEpFlfsEesUfezQ6UR7s1vuIuTyfBbfn-yCawNgc6IjEHKNUFHDixshpWZ5veTvqE6BDkSikcD4cbrRm5XYqEeb80G4E',
        students: 1234,
        duration: '24h 30m',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        schedule: 'T2-T6 18:00-20:00'
    },
    {
        id: 2,
        title: 'Kanji Mastery N3',
        description: 'Intermediate Kanji characters with focus on reading and writing.',
        level: 'N3' as const,
        status: 'Draft' as const,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWHOal0kvXGMu-t5vp-mlglyYNfjoz1NDYHrZWYA8L69lvcR64f67uUAl71T8cjjg0jvb1hTbIvfEkB0FzsMxCBe7cTcGR3vIpnaEHbwCFePa9vpuAqaLtAZ5M2b7wf9m4WKeX_SpbMM2iVJR7tvZhwybBGuzUFY8CnxWxEmI0pok6G7Z3zfA5ZPwg1SiRWimlX1fmAbyS5uaBoH7wipxYWKzI2ChKUcqI7WuxDh1B3MEieRdxXYBYFjjoE6fbNoMYFpmniJOxeME',
        students: 0,
        duration: '--h --m',
        startDate: '2024-02-01',
        endDate: '2024-04-30',
        schedule: 'T7-CN 09:00-11:00'
    },
    {
        id: 3,
        title: 'Listening Practice N2',
        description: 'Advanced listening comprehension for business and daily life scenarios.',
        level: 'N2' as const,
        status: 'Published' as const,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFsXLT3n_e_G88vVqTHlxkhS2JmrGG4seSCpwsYINOGN9v0Jad0vcezfekIsnLn1DFZWNqwikuMOURYzYfqFiFfC7aFBXFqoMoZ32rPYchVGfUN45E-YGENi58RgKJ6lG5M-YNaX4JGUyq-N0YPE9lebxMGLO_dqQj2scONdouTAmhVyBqIKN_fE0bY9y4PrLRKtBDC7SOOlnqU0B9zvvU0rqyEltETcwZqDS91Em2h3q5Cy42O4GmzJeuj50d-VmEblLNLH7OO-w',
        students: 892,
        duration: '18h 15m',
        startDate: '2024-03-01',
        endDate: '2024-05-31',
        schedule: 'T2-T7 19:00-21:00'
    },
    {
        id: 4,
        title: 'Business Japanese',
        description: 'Learn Keigo and formal business etiquette for working in Japan.',
        level: 'BIZ' as const,
        status: 'Draft' as const,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpedYxiLSuVEdzb7lPI2O3OosGHeVwrv7Dq_64dw3VOK96pG5m9mULyMKQ6Ae5MtvEEuORI7QcEMPBSvHRQvfT1ndIDYH-2Ns2ijEeGn3FMWzJ2lhkRnwe3PWnMQQxa3Vad0I_Wmkw0EFLBnUzs9eTIaulTm1jORkCKLx_G8hV7eksIC82vd5lVlZqD9wb_iPR9GTSQWjbxNSJQIWP3FaVC9yhL3hsCFVD4P0-hM5R5QOKDifjnAM1UxkYygS0riOBNd47anqyahw',
        students: 0,
        duration: '--h --m',
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        schedule: 'CN 14:00-16:00'
    },
    {
        id: 5,
        title: 'Grammar Foundation N4',
        description: 'Essential grammar structures to bridge beginner and intermediate levels.',
        level: 'N4' as const,
        status: 'Published' as const,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmU0A1Ib-Ts_fd2dN4lB_Gm8JqvWfatxRSQPeQM_ulhnvmj-aPEST_5bv140w2yVllpdAHNGLMW060KKfic4pjsORsMo0Lkv3kHNp0hdbe6-oRhQWf7wGiWfgPwykwLYvp_-rCAIa-fre6CYGFjGxUJVyr79Mv9lsG9gFZX22Xu92Q0uD5ZcMBb2A8nsoWnvSe3Iq_qYWbrbnuYW3PtBQxiaLur4_Nf8qIlh_c9DWaWj9-j0jDz1E5vtLvUTJA8bxR6wPRWoYYlns',
        students: 542,
        duration: '12h 45m',
        startDate: '2024-05-01',
        endDate: '2024-07-31',
        schedule: 'T3-T5 17:00-19:00'
    }
]

const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
        'N5': 'bg-orange-500',
        'N4': 'bg-emerald-600',
        'N3': 'bg-purple-600',
        'N2': 'bg-indigo-500',
        'N1': 'bg-red-600',
        'BIZ': 'bg-blue-500'
    }
    return colors[level] || 'bg-gray-500'
}

export default function CourseManagement() {
    const [openModal, setOpenModal] = useState(false)
    const [editingCourse, setEditingCourse] = useState<Course | null>(null)
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<'All' | 'Published' | 'Draft'>('All')
    const [theme, setTheme] = useState('light')

    const fetchCourses = async () => {
        try {
            const response = await fetch('/api/admin/courses')

            if (!response.ok) {
                throw new Error('API not ready')
            }

            const data = await response.json()
            setCourses(data)
        } catch (error) {
            console.warn('Using mock courses because API is not available')
            setCourses(MOCK_COURSES)
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        fetchCourses()
    }, [])

    useEffect(() => {
        const currentTheme = localStorage.getItem('theme') || 'light'
        setTheme(currentTheme)
    }, [])

    useEffect(() => {
        const handleThemeChange = (e: any) => {
            setTheme(e.detail)
        }

        window.addEventListener('themeChange', handleThemeChange)
        return () => window.removeEventListener('themeChange', handleThemeChange)
    }, [])

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = selectedStatus === 'All' || course.status === selectedStatus
        return matchesSearch && matchesStatus
    })

    const handleOpenModal = (course?: Course) => {
        setEditingCourse(course || null)
        setOpenModal(true)
    }

    const handleCloseModal = () => {
        setOpenModal(false)
        setEditingCourse(null)
    }

    const handleSuccess = () => {
        fetchCourses()
    }

    return (
        <div className="flex-1 overflow-y-auto bg-background">
            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-text-main">Quản lý khóa học</h1>
                        <p className="text-muted-foreground">Quản lý chương trình học và theo dõi tiến độ học tập của học sinh.</p>
                    </div>
                    <Button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-700 hover:shadow-md hover:shadow-blue-500/30 h-10 px-4 py-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Tạo khóa học mới
                    </Button>
                </div>

                {/* Filters Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6 mb-8">
                    <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                        {(['All', 'Published', 'Draft'] as const).map(status => (
                            <Button
                                key={status}
                                variant={selectedStatus === status ? "default" : "ghost"}
                                onClick={() => setSelectedStatus(status)}
                                className="px-3 py-1.5"
                            >
                                {status === 'All' ? 'Tất cả' : status === 'Published' ? 'Đã xuất bản' : 'Bản nháp'}
                            </Button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full max-w-sm">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                            <span className="material-symbols-outlined text-[18px] text-muted-foreground">
                                search
                            </span>
                        </span>

                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-12 h-10 w-full rounded-md border border-border bg-background pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:ring-1 hover:ring-primary dark:hover:ring-primary shadow-sm hover:shadow-sm transition-all"
                        />
                    </div>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-muted-foreground text-lg">Đang tải...</p>
                        </div>
                    ) : filteredCourses.length > 0 ? (
                        filteredCourses.map(course => (
                            <div
                                key={course.id}
                                className="bg-card rounded-xl border border-card-border text-card-foreground shadow-card group hover:shadow-card-hover hover:border-primary/30 transition-all duration-200"
                            >
                                {/* Image Container */}
                                <div className="aspect-video relative overflow-hidden rounded-t-xl">
                                    <img
                                        src={course.image}
                                        alt={course.title}
                                        className={`object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ${course.status === 'Draft' ? 'grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100' : ''
                                            }`}
                                    />
                                    {/* Status Badge */}
                                    <div className={`absolute top-3 right-3 ${course.status === 'Published'
                                        ? 'bg-white/90 backdrop-blur-md text-text-main'
                                        : 'bg-secondary text-secondary-foreground'
                                        } text-[10px] font-bold px-2 py-1 rounded-full border ${course.status === 'Published' ? 'border-gray-100' : 'border-secondary'
                                        } uppercase tracking-wide ${course.status === 'Published' ? 'shadow-sm' : ''
                                        }`}>
                                        {course.status === 'Published' ? 'Published' : 'Draft'}
                                    </div>
                                    {/* Level Badge */}
                                    <div className={`absolute bottom-3 left-3 ${getLevelColor(course.level)} text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-lg`}>
                                        {course.level}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 space-y-3">
                                    <div className="space-y-1">
                                        <h3 className="font-semibold leading-none tracking-tight text-lg text-text-main group-hover:text-primary transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {course.description}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">group</span>
                                            <span>{course.students || 0} Students</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                                            <span>{course.duration || '--h --m'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center p-4 pt-0 gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleOpenModal(course)}
                                        className="w-full"
                                    >
                                        {course.status === 'Draft' ? 'Tiếp tục soạn' : 'Chỉnh sửa'}
                                    </Button>
                                    {/* <button
                    onClick={() => handleDelete(course.id)}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive/10 hover:text-destructive text-muted-foreground h-9 w-9"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button> */}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-muted-foreground text-lg">Không tìm thấy khóa học nào</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <CourseModal
                open={openModal}
                onOpenChange={setOpenModal}
                mode={editingCourse ? 'edit' : 'create'}
                initialData={editingCourse}
                onSuccess={handleSuccess}
            />
        </div>
    )
}