import "@/styles/admin.css";
import { AdminLayoutWrapper } from "@/components/admin/layout";
import AdminGuard from "@/components/auth/AdminGuard";

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

