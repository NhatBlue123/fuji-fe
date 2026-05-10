export type CoursePreviewItem = {
  id: number;
  title: string;
  price?: string;
  thumbnail?: string;
  url: string;
  meta?: string;
  enrolled?: boolean;
};

export type CourseCompareColumn = {
  id: number;
  title: string;
  price?: string;
  thumbnail?: string;
  url: string;
};

export type CourseCompareRow = {
  label: string;
  values: string[];
};

export type CourseComparePayload = {
  title?: string;
  columns: CourseCompareColumn[];
  rows: CourseCompareRow[];
};

export type PaymentActionPayload = {
  label: string;
  url: string;
  note?: string;
};

export type ActionLinkItem = {
  label: string;
  url: string;
  note?: string;
  icon?: string;
  tone?: "primary" | "sky" | "emerald" | "amber" | "rose" | "slate";
  cta?: string;
};

export type NextStepItem = {
  label: string;
  url: string;
  note?: string;
  icon?: string;
};

export type NextStepsPayload = {
  title?: string;
  steps: NextStepItem[];
};

export type PurchaseSummaryPayload = {
  walletAvailable: string;
  affordableCount: number;
  cheapestAffordable?: string | null;
  cheapestMissingAmount?: string | null;
  ownedCount: number;
  recommendedAction: "view_affordable" | "topup";
};
export type StructuredBlockType =
  | "course-preview"
  | "course-compare"
  | "payment-action"
  | "action-links"
  | "quick-facts"
  | "purchase-summary"
  | "next-steps";

export type AssistantContentSegment =
  | { kind: "markdown"; content: string }
  | { kind: "course-preview"; items: CoursePreviewItem[] }
  | { kind: "course-compare"; payload: CourseComparePayload }
  | { kind: "payment-action"; payload: PaymentActionPayload }
  | { kind: "action-links"; links: ActionLinkItem[] }
  | { kind: "purchase-summary"; payload: PurchaseSummaryPayload }
  | { kind: "next-steps"; payload: NextStepsPayload }
  | { kind: "structured-loading"; blockType: StructuredBlockType };

export type RouterThinkingItem = {
  phase?: string;
  text: string;
};

export type ParseAssistantContentFn = (
  rawContent: string,
  options?: { streaming?: boolean },
) => AssistantContentSegment[];

export type AssistantQueuedInfo = {
  intent?: string;
  jobId?: string;
} | null;

