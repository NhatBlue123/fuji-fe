import "@/styles/admin.css";
import { AdminLayoutWrapper } from "@/components/admin/layout";
import AdminGuard from "@/components/auth/AdminGuard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </AdminGuard>
  );
}

