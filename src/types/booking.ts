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

export type TeacherAvailabilityGroup = {
  date: string;
  slots: DiscoverySlot[];
};

export type TeacherAvailabilityResponse = {
  teacherId: number;
  teacherName: string;
  teacherAvatarUrl: string | null;
  timezone: string;
  fromDate: string;
  toDate: string;
  items: TeacherAvailabilityGroup[];
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
  couponCode?: string | null;
  couponValid?: boolean | null;
  couponMessage?: string | null;
  discountVnd?: number;
  discountBlossom?: number;
  teacherPayoutVnd?: number;
  teacherPayoutBlossom?: number;
  platformRevenueVnd?: number;
  platformRevenueBlossom?: number;
  adminCommissionWaived?: boolean;
  walletAvailableVnd: number;
  walletAvailableBlossom: number;
  canPay: boolean;
  message: string;
};

export type BulkBookingQuoteItem = {
  timeSlotId: number;
  subject: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  tuitionVnd: number;
  tuitionBlossom: number;
  serviceFeeVnd: number;
  serviceFeeBlossom: number;
  totalVnd: number;
  totalBlossom: number;
};

export type BulkBookingQuote = {
  teacherId: number;
  teacherName: string;
  teacherAvatarUrl: string | null;
  slotCount: number;
  items: BulkBookingQuoteItem[];
  tuitionVnd: number;
  serviceFeeVnd: number;
  totalVnd: number;
  tuitionBlossom: number;
  serviceFeeBlossom: number;
  totalBlossom: number;
  couponCode?: string | null;
  couponValid?: boolean | null;
  couponMessage?: string | null;
  discountVnd?: number;
  discountBlossom?: number;
  teacherPayoutVnd?: number;
  teacherPayoutBlossom?: number;
  platformRevenueVnd?: number;
  platformRevenueBlossom?: number;
  adminCommissionWaived?: boolean;
  walletAvailableVnd: number;
  walletAvailableBlossom: number;
  canPay: boolean;
  message: string;
};

export type CreateBookingRequest = { timeSlotId: number; couponCode?: string };

export type CreateBulkBookingRequest = {
  teacherId: number;
  timeSlotIds: number[];
  couponCode?: string;
};

export type CreateBookingResponse = {
  bookingId: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  timeSlotId: number;
  totalVnd: number;
  totalBlossom: number;
  frozenBalanceVnd: number;
  couponCode?: string | null;
  discountBlossom?: number;
  teacherPayoutBlossom?: number;
  platformRevenueBlossom?: number;
  adminCommissionWaived?: boolean;
};

export type BulkBookingCreatedItem = {
  bookingId: number;
  timeSlotId: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalVnd: number;
  totalBlossom: number;
};

export type CreateBulkBookingResponse = {
  teacherId: number;
  teacherName: string;
  bookingCount: number;
  totalVnd: number;
  totalBlossom: number;
  frozenBalanceVnd: number;
  couponCode?: string | null;
  discountBlossom?: number;
  teacherPayoutBlossom?: number;
  platformRevenueBlossom?: number;
  adminCommissionWaived?: boolean;
  items: BulkBookingCreatedItem[];
};

export type BookingStatusTab = "UPCOMING" | "COMPLETED" | "CANCELLED";

export type MyTimeSlotItem = {
  id: number;
  subject: string;
  startAt: string;
  endAt: string;
  price: number;
  status: string; // AVAILABLE, BOOKED
};

export type MyBookingItem = {
  bookingId: number;
  status: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  studentName: string | null;
  studentAvatarUrl: string | null;
  role: "STUDENT" | "TEACHER";
  subject: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  canJoinVideoCall?: boolean;
};

export type BookingDetail = {
  bookingId: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
  subject: string;
  teacherName: string;
  studentName: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  canJoinVideoCall: boolean;
};

export type VideoSessionResponse = {
  sessionId: number;
  bookingId: number;
  roomKey: string;
  status: string;
  role: "TEACHER" | "STUDENT";
  peerName: string;
  peerAvatarUrl: string | null;
  subject: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  remainingSeconds: number;
};
export type TeacherScheduleSlot = {
  timeSlotId: number;
  status: "AVAILABLE" | "BOOKED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
  startAt: string;
  endAt: string;
  durationMinutes: number;
  subject: string;
  tuitionVnd: number;
  tuitionBlossom: number;
  studentId: number | null;
  studentName: string | null;
  bookingStatus: "PENDING" | "CONFIRMED" | null;
};

export type TeacherScheduleGroup = {
  date: string;
  slots: TeacherScheduleSlot[];
};

export type TeacherScheduleResponse = {
  teacherId: number;
  teacherName: string;
  teacherAvatarUrl: string | null;
  timezone: string;
  fromDate: string;
  toDate: string;
  items: TeacherScheduleGroup[];
};

export type StudentBusySlot = {
  timeSlotId: number;
  teacherId: number;
  teacherName: string;
  startAt: string;
  endAt: string;
  subject: string;
};

export type StudentBusySlotsResponse = {
  date: string;
  busySlots: StudentBusySlot[];
};
