export type ChatViolationType = "VIETNAMESE" | "ENGLISH" | "OTHER";

export interface ChatViolation {
  id: number;
  userId: string;
  sessionId?: string;
  violationType: ChatViolationType;
  messageContent: string;
  detectedAt?: string;
  ipAddress?: string;
}

export interface ChatBan {
  id: number;
  userId: string;
  banType: "TEMPORARY" | "PERMANENT";
  banUntil?: string | null;
  violationCount: number;
  createdAt?: string;
  updatedAt?: string;
}

