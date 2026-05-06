/**
 * Layout riêng cho trang AI Sensei.
 * - Ẩn header của app
 * - Ẩn footer (không cần thanh cuộn toàn trang)
 * - Ghi đè overflow của thẻ main từ parent layout
 * - Socket provider đã được wrap ở AppShell (layout chính)
 */

export default function SenseiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* CSS để ẩn header/footer và khóa overflow của main khi ở trang này */}
      <style>{`
        [data-app-header] { display: none !important; }
        footer { display: none !important; }
        main { overflow: hidden !important; }
      `}</style>
      {children}
    </>
  );
}
