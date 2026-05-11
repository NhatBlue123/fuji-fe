"use client";

/**
 * AppShell — Client-only wrapper cho Sidebar, Header, MobileHeader, Footer.
 *
 * Lý do tồn tại:
 * Sidebar và Header phụ thuộc vào localStorage (theme, i18n language, auth state).
 * Nếu chúng được SSR, server render với giá trị mặc định (vi, light) nhưng client
 * hydrate với giá trị từ localStorage (ja, dark) → hydration mismatch → flash.
 *
 * Bằng cách bọc trong "use client" component này và dùng suppressHydrationWarning,
 * React sẽ bỏ qua diff giữa server và client cho toàn bộ shell, loại bỏ flash.
 */

import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileHeader from "./MobileHeader";
import Footer from "./Footer";
import MobieSidebar from "./Mobie-sidebar";
import { AIChatSocketProvider } from "@/providers/AIChatSocketProvider";
import ChatDock from "@/components/chatdock/ChatDock";

export default function AppShell({
  children,
  auth,
}: {
  children: React.ReactNode;
  auth?: React.ReactNode;
}) {
  return (
    <AIChatSocketProvider>
      <div suppressHydrationWarning className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <MobileHeader />
          <main
            data-app-main
            className="flex-1 overflow-y-auto relative scroll-smooth bg-background pt-0 font-sans flex flex-col"
          >
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </main>
          {auth}
        </div>
        <MobieSidebar />
        <ChatDock />
      </div>
    </AIChatSocketProvider>
  );
}
