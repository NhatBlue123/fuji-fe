import Sidebar from "@/components/user-component/layout/Sidebar";
import MobieSidebar from "@/components/user-component/layout/Mobie-sidebar";
import "@/app/globals.css";
import Footer from "@/components/user-component/layout/Footer";

export default function UserLayout({
  children,
  auth,
}: {
  children: React.ReactNode;
  auth: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative scroll-smooth bg-background">
        <MobieSidebar />
        {children}
        <Footer />
      </main>
      {auth}
    </div>
  );
}
