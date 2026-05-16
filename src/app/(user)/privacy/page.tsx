import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư | FUJI",
  description: "Chính sách xử lý dữ liệu và quyền riêng tư của FUJI.",
};

const sections = [
  {
    title: "1. Dữ liệu chúng tôi xử lý",
    body: "FUJI có thể xử lý thông tin tài khoản, hồ sơ học tập, lịch học, thanh toán, nội dung tương tác trong lớp, ghi chú, transcript, phản hồi và dữ liệu kỹ thuật cần thiết để vận hành nền tảng.",
  },
  {
    title: "2. Mục đích sử dụng",
    body: "Dữ liệu được dùng để xác thực tài khoản, cung cấp lớp học, lưu tiến độ học tập, cá nhân hóa trải nghiệm, xử lý giao dịch, hỗ trợ người dùng, cải thiện chất lượng dịch vụ và bảo vệ hệ thống.",
  },
  {
    title: "3. AI và nội dung học tập",
    body: "Một số tính năng AI có thể dùng nội dung bạn gửi để tạo phản hồi, tóm tắt hoặc gợi ý học tập. FUJI áp dụng các giới hạn truy cập nội bộ và chỉ sử dụng dữ liệu theo phạm vi cần thiết cho tính năng bạn yêu cầu.",
  },
  {
    title: "4. Chia sẻ dữ liệu",
    body: "FUJI không bán dữ liệu cá nhân. Dữ liệu có thể được chia sẻ với nhà cung cấp hạ tầng, thanh toán, lưu trữ, email hoặc công cụ AI khi cần thiết để cung cấp dịch vụ, theo các biện pháp kiểm soát phù hợp.",
  },
  {
    title: "5. Quyền của bạn",
    body: "Bạn có thể yêu cầu cập nhật thông tin, đổi mật khẩu, xem dữ liệu liên quan đến tài khoản hoặc liên hệ hỗ trợ nếu cần xử lý vấn đề về quyền riêng tư và bảo mật.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-20 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4 border-b border-border pb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            FUJI
          </p>
          <h1 className="text-4xl font-black tracking-tight">Chính sách quyền riêng tư</h1>
          <p className="max-w-2xl text-base font-medium leading-7 text-muted-foreground">
            Cập nhật lần cuối: 16/05/2026. Trang này mô tả cách FUJI xử lý dữ liệu khi bạn sử dụng nền tảng.
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
