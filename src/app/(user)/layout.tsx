"use client";

import Header from "@/components/user-component/layout/Header";
import Sidebar from "@/components/user-component/layout/Sidebar";
import Footer from "@/components/user-component/layout/Footer";
import MobieSidebar from "@/components/user-component/layout/Mobie-sidebar";

export default function UserLayout({
  children,
  auth,
}: {
  children: React.ReactNode;
  auth: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        
        {/* Main content Area - Duy nhất vùng này được cuộn */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-background pt-0 font-sans flex flex-col">
          <MobieSidebar />
          
          {/* Nội dung chính có Padding riêng */}
          <div className="flex-1 px-4 md:px-8 lg:px-12">
            {children}
            {auth}
          </div>

          {/* Footer nằm ở cuối luồng cuộn, trải dài 2 bên */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
