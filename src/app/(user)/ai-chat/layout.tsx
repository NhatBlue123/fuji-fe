/**
 * Layout riêng cho trang AI Chat.
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
      {/* CSS để ẩn footer và khóa overflow của main khi ở trang này */}
      <style>{`
        footer { display: none !important; }
        main { overflow: hidden !important; }
      `}</style>
      {children}
    </>
  );
}
