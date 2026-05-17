import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ | FUJI",
  description: "Điều khoản sử dụng nền tảng học tập FUJI.",
};

const sections = [
  {
    title: "1. Phạm vi sử dụng",
    body: "FUJI cung cấp nền tảng học tập, đặt lịch, lớp học trực tuyến, flashcard, luyện thi và các công cụ AI hỗ trợ học tập. Khi sử dụng dịch vụ, bạn đồng ý dùng tài khoản đúng mục đích, không can thiệp hệ thống và không sử dụng nền tảng để vi phạm pháp luật hoặc quyền của người khác.",
  },
  {
    title: "2. Tài khoản và bảo mật",
    body: "Bạn chịu trách nhiệm giữ an toàn thông tin đăng nhập, thiết bị và phiên đăng nhập của mình. Nếu phát hiện truy cập trái phép hoặc hoạt động bất thường, hãy đổi mật khẩu và liên hệ đội ngũ hỗ trợ FUJI.",
  },
  {
    title: "3. Nội dung học tập và lớp học",
    body: "Tài liệu, bài học, transcript, ghi chú, whiteboard và nội dung do giáo viên hoặc hệ thống tạo ra được dùng cho mục đích học tập. Bạn không được sao chép, phân phối lại hoặc khai thác thương mại nếu chưa có sự cho phép phù hợp.",
  },
  {
    title: "4. Thanh toán và gói dịch vụ",
    body: "Các gói học, lượt sử dụng AI, ví Blossom và ưu đãi có thể có giới hạn riêng về thời hạn, phạm vi sử dụng và điều kiện hoàn/hủy. Thông tin hiển thị tại thời điểm thanh toán là căn cứ áp dụng cho giao dịch đó.",
  },
  {
    title: "5. Thay đổi dịch vụ",
    body: "FUJI có thể cập nhật tính năng, chính sách vận hành hoặc điều khoản để cải thiện chất lượng dịch vụ. Các thay đổi quan trọng sẽ được thông báo qua kênh phù hợp trong hệ thống.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-20 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4 border-b border-border pb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            FUJI
          </p>
          <h1 className="text-4xl font-black tracking-tight">Điều khoản dịch vụ</h1>
          <p className="max-w-2xl text-base font-medium leading-7 text-muted-foreground">
            Cập nhật lần cuối: 16/05/2026. Trang này tóm tắt các điều kiện cơ bản khi sử dụng nền tảng FUJI.
          </p>
        </header>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-black tracking-tight">{section.title}</h2>
              <p className="text-sm font-medium leading-7 text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
