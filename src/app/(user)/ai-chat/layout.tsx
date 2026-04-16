/**
 * Layout riêng cho trang AI Chat.
 * - Ẩn header của app
 * - Ẩn footer (không cần thanh cuộn toàn trang)
 * - Ghi đè overflow của thẻ main từ parent layout
 */

export default function AIChatLayout({
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
