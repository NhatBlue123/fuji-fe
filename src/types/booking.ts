export type ApiEnvelope<T> = {
  success: boolean;
  message?: string | null;
  data: T;
  timestamp?: string;
};

export type DiscoverySlot = {
  timeSlotId: number;
  status: "AVAILABLE" | "BOOKED";
  startAt: string;
  endAt: string;
  durationMinutes: number;
  teacherId: number;
  teacherName: string;
  teacherAvatarUrl: string | null;
  subject: string;
  tuitionVnd: number;
  tuitionBlossom: number;
};

export type DiscoveryResponse = {
  date: string;
  timezone: string;
  items: DiscoverySlot[];
};

export type BookingQuote = {
  timeSlotId: number;
  teacherName: string;
  teacherAvatarUrl: string | null;
  subject: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  tuitionVnd: number;
  serviceFeeVnd: number;
  totalVnd: number;
  tuitionBlossom: number;
  serviceFeeBlossom: number;
  totalBlossom: number;
  walletAvailableVnd: number;
  walletAvailableBlossom: number;
  canPay: boolean;
  message: string;
};

export type CreateBookingRequest = { timeSlotId: number };
export type CreateBookingResponse = {
  bookingId: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  timeSlotId: number;
  totalVnd: number;
  totalBlossom: number;
  frozenBalanceVnd: number;
};

export type BookingStatusTab = "UPCOMING" | "COMPLETED" | "CANCELLED";

export type MyBookingItem = {
  bookingId: number;
  status: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  subject: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
};
