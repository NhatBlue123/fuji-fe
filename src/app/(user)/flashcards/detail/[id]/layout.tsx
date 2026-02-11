export default function Layout({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: React.ReactNode;
}) {
  return (
    <>
      {children}
      {settings}
    </>
  );
}
