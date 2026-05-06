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
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AppShell({
  children,
  auth,
}: {
  children: React.ReactNode;
  auth?: React.ReactNode;
}) {
  const pathname = usePathname();
  const usesFinancePageBackground =
    pathname === "/profile/wallet" || pathname === "/withdraw";
  const usesAlwaysDarkFinanceBackground = pathname === "/withdraw";

  return (
    <AIChatSocketProvider>
      <div
        suppressHydrationWarning
        className={cn(
          "flex h-screen w-full overflow-hidden bg-background",
          usesAlwaysDarkFinanceBackground && "dark",
        )}
      >
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <MobileHeader />
          <main
            data-app-main
            className={cn(
              "relative flex flex-1 flex-col overflow-y-auto scroll-smooth bg-background pt-0 font-sans",
              usesFinancePageBackground && "bg-slate-50 dark:bg-[#070b14]",
              usesAlwaysDarkFinanceBackground && "bg-[#070b14]",
            )}
          >
            <div
              className={cn(
                "flex-1",
                usesFinancePageBackground && "bg-slate-50 dark:bg-[#070b14]",
                usesAlwaysDarkFinanceBackground && "bg-[#070b14]",
              )}
            >
              {children}
              {auth}
            </div>
            <Footer />
          </main>
        </div>
        <MobieSidebar />
        <ChatDock />
      </div>
    </AIChatSocketProvider>
  );
}
