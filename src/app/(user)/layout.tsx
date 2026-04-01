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
    <div suppressHydrationWarning className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        
        {/* Main content Area*/}
        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-background pt-0 font-sans flex flex-col">
          <MobieSidebar />
          
          <div className="flex-1">
            {children}
            {auth}
          </div>
          
          <Footer />
        </main>
      </div>
    </div>
  );
}
