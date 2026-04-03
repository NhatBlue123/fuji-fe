import { Mode, TimeRange } from "./types";
import { toBlossom } from "./utils";

type Props = {
  mode: Mode;
  subject: string;
  price: number;
  ranges: TimeRange[];
  estimatedSlots: number;
};

export default function PreviewCard({ mode, subject, price, ranges, estimatedSlots }: Props) {
  return (
    <aside className="glass-card rounded-2xl border border-border p-6">
      <h2 className="text-xl font-bold">Xem trước</h2>
      <p className="text-muted-foreground text-sm mt-1">Ước tính số buổi sẽ tạo trước khi lưu</p>

      <div className="mt-4 rounded-2xl border border-border bg-card/70 p-5">
        <p className="text-muted-foreground text-sm">Chế độ</p>
        <p className="font-bold">{mode === "single" ? "Một buổi" : "Lịch lặp"}</p>

        <div className="h-px bg-border my-4" />

        <p className="text-muted-foreground text-sm">Khung giờ</p>
        <div className="mt-2 space-y-1">
          {ranges.map((r, i) => (
            <p key={i} className=" font-bold">
              {r.start} - {r.end}
            </p>
          ))}
        </div>

        <div className="h-px bg-border my-4" />

        <p className="text-muted-foreground text-sm">Môn học</p>
        <p className="font-bold">{subject || "-"}</p>

        <p className="text-muted-foreground text-sm mt-3">Học phí(1 buổi)</p>
        <p className="font-bold">
          {(price || 0).toLocaleString("vi-VN")}đ · {toBlossom(price)} 🌸
        </p>

        <div className="h-px bg-border my-4" />

        <p className="text-muted-foreground text-sm">Ước tính số buổi tạo</p>
        <p className="text-3xl font-black">{estimatedSlots}</p>
      </div>
    </aside>
  );
}
