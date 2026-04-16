import { useTranslation } from "react-i18next";
import { Mode, TimeRange } from "./types";
import { toVnd } from "./utils";

type Props = {
  mode: Mode;
  subject: string;
  price: number;
  ranges: TimeRange[];
  estimatedSlots: number;
};

export default function PreviewCard({
  mode,
  subject,
  price,
  ranges,
  estimatedSlots,
}: Props) {
  const { t } = useTranslation();
  return (
    <aside className="glass-card rounded-2xl border border-border p-6">
      <h2 className="text-xl font-bold">{t('auto.booking_preview_1')}</h2>
      <p className="text-muted-foreground text-sm mt-1">
        Ước tính số buổi sẽ tạo trước khi lưu
      </p>

      <div className="mt-4 rounded-2xl border border-border bg-card/70 p-5">
        <p className="text-muted-foreground text-sm">{t('auto.booking_preview_2')}</p>
        <p className="font-bold">
          {mode === "single" ? "Một buổi" : "Lịch lặp"}
        </p>

        <div className="h-px bg-border my-4" />

        <p className="text-muted-foreground text-sm">{t('auto.booking_preview_3')}</p>
        <div className="mt-2 space-y-1">
          {ranges.map((r, i) => (
            <p key={i} className=" font-bold">
              {r.start} - {r.end}
            </p>
          ))}
        </div>

        <div className="h-px bg-border my-4" />

        <p className="text-muted-foreground text-sm">{t('auto.booking_preview_4')}</p>
        <p className="font-bold">{subject || "-"}</p>

        <p className="text-muted-foreground text-sm mt-3">{t('auto.booking_preview_5')}</p>
        <p className="font-bold">
          {(price || 0).toLocaleString("vi-VN")} 🌸 · ~
          {toVnd(price).toLocaleString("vi-VN")}đ
        </p>

        <div className="h-px bg-border my-4" />

        <p className="text-muted-foreground text-sm">{t('auto.booking_preview_6')}</p>
        <p className="text-3xl font-black">{estimatedSlots}</p>
      </div>
    </aside>
  );
}
