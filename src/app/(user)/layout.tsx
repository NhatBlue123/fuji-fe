import Sidebar from "@/components/user-component/layout/Sidebar";
import MobieSidebar from "@/components/user-component/layout/Mobie-sidebar";
import Footer from "@/components/user-component/layout/Footer";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative scroll-smooth bg-gray-50 dark:bg-[#0f172a]">
        <MobieSidebar />
        {children}
        <Footer />
      </main>
    </div>
  );
}
