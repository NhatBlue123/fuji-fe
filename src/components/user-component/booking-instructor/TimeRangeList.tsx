import { useTranslation } from "react-i18next";
import { TimeRange } from "./types";

type Props = {
  ranges: TimeRange[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, patch: Partial<TimeRange>) => void;
};

export default function TimeRangeList({ ranges, onAdd, onRemove, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{t('auto.booking_time_1')}</p>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-semibold text-primary hover:text-primary/80"
        >
          + Thêm khung giờ
        </button>
      </div>

      <div className="space-y-3">
        {ranges.map((r, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_1fr_auto] gap-3 rounded-xl border border-border bg-card/60 p-3"
          >
            <input
              type="time"
              value={r.start}
              onChange={(e) => onChange(idx, { start: e.target.value })}
              className="h-11 rounded-lg border border-border bg-background px-3 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
            />
            <input
              type="time"
              value={r.end}
              onChange={(e) => onChange(idx, { end: e.target.value })}
              className="h-11 rounded-lg border border-border bg-background px-3 text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
            />
            <button
              type="button"
              onClick={() => onRemove(idx)}
              disabled={ranges.length === 1}
              className="h-11 px-3 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40"
            >{t("common.delete")}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
