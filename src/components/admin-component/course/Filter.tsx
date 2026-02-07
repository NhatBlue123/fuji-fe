'use client'

import { useState, useEffect } from 'react'

export default function Filter({ onFilterChange }: { onFilterChange: (filters: { search: string; status: string }) => void }) {
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')

  useEffect(() => {
    onFilterChange({ search, status: selectedStatus })
  }, [search, selectedStatus])

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6 mb-8">
      <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
        {(['All', 'Published', 'Draft'] as const).map(status => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedStatus === status
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'hover:text-primary hover:bg-primary/10'
              }`}
          >
            {status === 'All' ? 'Tất cả' : status === 'Published' ? 'Đã xuất bản' : 'Bản nháp'}
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-sm">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <span className="material-symbols-outlined text-[18px] text-muted-foreground">
            search
          </span>
        </span>

        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-12 h-10 w-full rounded-md border border-border bg-background pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
      </div>
    </div>
  )
}