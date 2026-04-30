import AppShell from "@/components/user-component/layout/AppShell";

export default function UserLayout({
  children,
  auth,
}: {
  children: React.ReactNode;
  auth: React.ReactNode;
}) {
  return (
    <AppShell auth={auth}>
      {children}
    </AppShell>
  );
}
