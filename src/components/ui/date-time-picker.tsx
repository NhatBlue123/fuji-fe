"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateTimePickerProps {
  /** Giá trị dạng "YYYY-MM-DDTHH:mm" (datetime-local format) */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function parseDateTimeLocal(value?: string): { date: Date | undefined; time: string } {
  if (!value) return { date: undefined, time: "00:00" };
  const d = new Date(value);
  if (!isValid(d)) return { date: undefined, time: "00:00" };
  const time = format(d, "HH:mm");
  return { date: d, time };
}

function toDateTimeLocal(date: Date, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
  return format(result, "yyyy-MM-dd'T'HH:mm");
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Chọn ngày giờ",
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { date, time } = parseDateTimeLocal(value);
  const [timeInput, setTimeInput] = React.useState(time);

  // Sync timeInput khi value thay đổi từ bên ngoài
  React.useEffect(() => {
    const { time: t } = parseDateTimeLocal(value);
    setTimeInput(t);
  }, [value]);

  const handleDaySelect = (selected: Date | undefined) => {
    if (!selected) {
      onChange?.("");
      return;
    }
    onChange?.(toDateTimeLocal(selected, timeInput));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    setTimeInput(t);
    if (date) {
      onChange?.(toDateTimeLocal(date, t));
    }
  };

  const displayLabel = date
    ? `${format(date, "dd/MM/yyyy", { locale: vi })} ${timeInput}`
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {displayLabel ?? placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDaySelect}
          locale={vi}
          initialFocus
        />

        <div className="border-t px-3 pb-3 pt-2">
          <Label className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Giờ
          </Label>
          <Input
            type="time"
            value={timeInput}
            onChange={handleTimeChange}
            className="h-8 text-sm"
          />
        </div>

        {date && (
          <div className="border-t px-3 pb-3 pt-2 flex justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => { onChange?.(""); setOpen(false); }}
            >
              Xóa
            </Button>
            <Button size="sm" className="text-xs" onClick={() => setOpen(false)}>
              Xong
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
