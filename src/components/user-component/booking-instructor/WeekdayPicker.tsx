import { WEEKDAYS } from "./utils";
import { Weekday } from "./types";

type Props = {
  value: Weekday[];
  onToggle: (day: Weekday) => void;
};

export default function WeekdayPicker({ value, onToggle }: Props) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-2">Lặp theo thứ</p>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((d) => {
          const active = value.includes(d.key);
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onToggle(d.key)}
              className={`h-10 px-4 rounded-xl border text-sm font-semibold transition ${
                active
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-card text-foreground border-border hover:border-secondary/50"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
