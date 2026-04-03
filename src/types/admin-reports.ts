export type ReportCategory = "JLPT_QUESTION" | "PAYMENT" | "COURSE" | "NOTIFICATION" | "OTHER";

export type SystemReportStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED";

export type ReportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface SystemReport {
  id: number;
  category: ReportCategory;
  title: string;
  description?: string | null;
  priority: ReportPriority;
  status: SystemReportStatus;
  subjectType?: string | null;
  subjectId?: string | null;
  createdByUserId?: number | null;
  createdByName?: string | null;
  adminNote?: string | null;
  attachmentUrls?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSystemReportPayload {
  category: ReportCategory;
  title: string;
  description?: string;
  priority?: ReportPriority;
  subjectType?: string;
  subjectId?: string;
  createdByUserId?: number;
  attachmentUrls?: string;
}

export interface UpdateSystemReportPayload {
  status?: SystemReportStatus;
  priority?: ReportPriority;
  adminNote?: string;
}

export interface SystemReportNote {
  id: number;
  reportId: number;
  authorUserId?: number | null;
  authorName?: string | null;
  note: string;
  createdAt: string;
}

export interface CreateSystemReportNotePayload {
  note: string;
  authorUserId?: number;
}

