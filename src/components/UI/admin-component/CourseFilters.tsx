import { Tabs, TabsList, TabsTrigger } from "./admin-ui/tabs"

export function CourseFilters({ onChange }: { onChange?: (v: string) => void }) {
  return (
    <Tabs defaultValue="all" onValueChange={onChange}>
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        {/* LEFT: Tabs */}
        <TabsList className="shrink-0">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="published">Đã xuất bản</TabsTrigger>
          <TabsTrigger value="draft">Bản nháp</TabsTrigger>
        </TabsList>

        {/* RIGHT: Search */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground material-symbols-outlined text-[18px]">
            search
          </span>
          <input
            className="flex h-10 w-full rounded-md border border-border bg-white dark:bg-gray-800 px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search courses..."
          />
        </div>
      </div>
    </Tabs>
  )
}
