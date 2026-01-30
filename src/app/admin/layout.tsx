import AdminHeader from "@/components/ui/AdminHeader";
import AdminSidebar from "@/components/ui/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background text-text-main">
      <AdminSidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}