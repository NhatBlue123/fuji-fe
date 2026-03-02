import CourseAdminLayout from "@/components/UI/admin-component/CourseAdminLayout"
import { CourseGrid } from "@/components/UI/admin-component/CourseGrid"
import { SidebarProvider } from "@/components/UI/admin-component/SidebarContext"
import '@/app/globals.css'

export default function CourseManagementPage() {
  return (
    <SidebarProvider>
      <CourseAdminLayout>
        {/* Cột bên phải */}
        <div className="flex-1 flex flex-col bg-background text-foreground">

          {/* CONTENT – phần này được scroll */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-8">
              <div className="max-w-7xl mx-auto space-y-8">
                <CourseGrid />
              </div>
            </div>
          </main>

        </div>
      </CourseAdminLayout>
    </SidebarProvider>
  )
}
