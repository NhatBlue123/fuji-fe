import "@/styles/admin.css";
import { AdminLayoutWrapper } from "@/components/admin/layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
