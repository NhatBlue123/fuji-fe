export type Mode = "single" | "bulk";
export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type TimeRange = {
  start: string;
  end: string;   
};

export type BulkRequest = {
  dateFrom: string;
  dateTo: string;
  daysOfWeek: Weekday[];
  timeRanges: TimeRange[];
  price: number;
  subject: string;
};

export type BulkResponse = {
  requested: number;
  created: number;
  skipped: number;
  conflictMode: string;
  createdSlots: {
    id: number;
    startAt: string;
    endAt: string;
    price: number;
    subject: string;
    status: string;
    teacherId: number;
    teacherName: string;
  }[];
  conflicts: {
    startAt: string;
    endAt: string;
    reason: string;
  }[];
};
