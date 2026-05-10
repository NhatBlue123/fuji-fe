import type {
  ActionLinkItem,
  AssistantContentSegment,
  CourseCompareColumn,
  CourseComparePayload,
  CourseCompareRow,
  CoursePreviewItem,
  NextStepsPayload,
  PaymentActionPayload,
  PurchaseSummaryPayload,
  StructuredBlockType,
} from "./types";

const INTERNAL_URL_RE = /^\/[a-z0-9/_-]+(?:\?[a-z0-9=&%._-]+)?$/i;
const ALLOWED_TONES = new Set([
  "primary",
  "sky",
  "emerald",
  "amber",
  "rose",
  "slate",
]);

function sanitizeTone(value: unknown) {
  const tone = String(value || "")
    .trim()
    .toLowerCase();
  if (!tone || !ALLOWED_TONES.has(tone)) {
    return undefined;
  }
  return tone as "primary" | "sky" | "emerald" | "amber" | "rose" | "slate";
}

function sanitizeIconName(value: unknown) {
  const icon = String(value || "")
    .trim()
    .toLowerCase();
  if (!icon) {
    return undefined;
  }
  if (!/^[a-z0-9_]{2,36}$/i.test(icon)) {
    return undefined;
  }
  return icon;
}

function displayFlowerIcon(value: string) {
  return value.replace(/\s+hoa\b/gi, " 🌸");
}

function sanitizeCoursePreviewItems(value: unknown): CoursePreviewItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CoursePreviewItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const record = raw as Record<string, unknown>;
    const id = Number(record.id);
    const title = typeof record.title === "string" ? record.title.trim() : "";
    const urlRaw = typeof record.url === "string" ? record.url.trim() : "";
    const safeUrl = /^\/course\/\d+$/i.test(urlRaw)
      ? urlRaw
      : id > 0
        ? `/course/${id}`
        : "";

    if (!title || !safeUrl || !Number.isFinite(id) || id <= 0) {
      continue;
    }

    items.push({
      id,
      title,
      url: safeUrl,
      price:
        typeof record.price === "string"
          ? displayFlowerIcon(record.price.trim())
          : undefined,
      thumbnail:
        typeof record.thumbnail === "string"
          ? record.thumbnail.trim()
          : undefined,
      meta: typeof record.meta === "string" ? record.meta.trim() : undefined,
      enrolled: Boolean(record.enrolled),
    });
  }

  return items.slice(0, 6);
}

function sanitizeCourseComparePayload(
  value: unknown,
): CourseComparePayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawColumns = Array.isArray(record.columns) ? record.columns : [];
  const columns: CourseCompareColumn[] = [];

  for (const raw of rawColumns) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const col = raw as Record<string, unknown>;
    const id = Number(col.id);
    const title = typeof col.title === "string" ? col.title.trim() : "";
    const urlRaw = typeof col.url === "string" ? col.url.trim() : "";
    const safeUrl = /^\/course\/\d+$/i.test(urlRaw)
      ? urlRaw
      : id > 0
        ? `/course/${id}`
        : "";

    if (!title || !safeUrl || !Number.isFinite(id) || id <= 0) {
      continue;
    }

    columns.push({
      id,
      title,
      url: safeUrl,
      price:
        typeof col.price === "string"
          ? displayFlowerIcon(col.price.trim())
          : undefined,
      thumbnail:
        typeof col.thumbnail === "string" ? col.thumbnail.trim() : undefined,
    });
  }

  if (columns.length === 0) {
    return null;
  }

  const limitedColumns = columns.slice(0, 3);
  const rawRows = Array.isArray(record.rows) ? record.rows : [];
  const rows: CourseCompareRow[] = [];

  for (const raw of rawRows) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const row = raw as Record<string, unknown>;
    const label = typeof row.label === "string" ? row.label.trim() : "";
    const valuesRaw = Array.isArray(row.values) ? row.values : [];
    if (!label) {
      continue;
    }

    const values = limitedColumns.map((_, idx) => {
      const value = valuesRaw[idx];
      if (value == null) {
        return "-";
      }
      return String(value).trim() || "-";
    });

    rows.push({ label, values });
  }

  if (rows.length === 0) {
    return null;
  }

  const title =
    typeof record.title === "string" ? record.title.trim() : undefined;
  return {
    title,
    columns: limitedColumns,
    rows: rows.slice(0, 10),
  };
}

function sanitizePaymentActionPayload(
  value: unknown,
): PaymentActionPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const label =
    typeof record.label === "string" && record.label.trim()
      ? displayFlowerIcon(record.label.trim())
      : "Nạp 🌸 để mua khóa học";

  const urlRaw =
    typeof record.url === "string" && record.url.trim()
      ? record.url.trim()
      : "/premium?tab=topup";

  const safeUrl = /^\/[a-z0-9/_-]+(?:\?[a-z0-9=&%._-]+)?$/i.test(urlRaw)
    ? urlRaw
    : "/premium?tab=topup";

  const note =
    typeof record.note === "string" && record.note.trim()
      ? displayFlowerIcon(record.note.trim())
      : undefined;

  return {
    label,
    url: safeUrl,
    note,
  };
}

function sanitizeActionLinksPayload(value: unknown): ActionLinkItem[] {
  const wrapped = value as { links?: unknown };
  const rawList = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray(wrapped.links)
      ? wrapped.links
      : [];

  const out: ActionLinkItem[] = [];
  for (const raw of rawList) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const record = raw as Record<string, unknown>;
    const label =
      typeof record.label === "string" && record.label.trim()
        ? displayFlowerIcon(record.label.trim())
        : "Mở liên kết";

    const urlRaw =
      typeof record.url === "string" && record.url.trim()
        ? record.url.trim()
        : "";

    if (!INTERNAL_URL_RE.test(urlRaw)) {
      continue;
    }

    const note =
      typeof record.note === "string" && record.note.trim()
        ? displayFlowerIcon(record.note.trim())
        : undefined;

    const icon = sanitizeIconName(record.icon);
    const tone = sanitizeTone(record.tone);
    const cta =
      typeof record.cta === "string" && record.cta.trim()
        ? displayFlowerIcon(record.cta.trim()).slice(0, 28)
        : undefined;

    out.push({ label, url: urlRaw, note, icon, tone, cta });
  }

  return out.slice(0, 6);
}

function inferActionLabelFromUrl(url: string) {
  if (/^\/booking\/booked-schedule$/i.test(url)) {
    return "Lịch đã đặt của tôi";
  }
  if (/^\/booking$/i.test(url)) {
    return "Đặt lịch với giáo viên";
  }
  if (/^\/premium\?tab=topup$/i.test(url)) {
    return "Nạp 🌸";
  }
  if (/^\/premium\?tab=premium$/i.test(url)) {
    return "Xem bảng gói thành viên";
  }
  if (/^\/profile\/subscription$/i.test(url)) {
    return "Quản lý gói của tôi";
  }
  if (/^\/course\/\d+$/i.test(url)) {
    return "Xem chi tiết khóa học";
  }
  if (/^\/course$/i.test(url)) {
    return "Xem tất cả khóa học";
  }
  return "Mở trang";
}

function inferActionNoteFromUrl(url: string) {
  if (/^\/booking\/booked-schedule$/i.test(url)) {
    return "Mở danh sách buổi học đã đặt";
  }
  if (/^\/booking$/i.test(url)) {
    return "Chọn giáo viên và khung giờ phù hợp";
  }
  if (/^\/premium\?tab=topup$/i.test(url)) {
    return "Nạp 🌸 trước khi thanh toán";
  }
  if (/^\/premium\?tab=premium$/i.test(url)) {
    return "Xem quyền lợi và bảng giá gói thành viên";
  }
  if (/^\/profile\/subscription$/i.test(url)) {
    return "Kiểm tra gói hiện tại và lịch sử đăng ký";
  }
  if (/^\/course\/\d+$/i.test(url)) {
    return "Mở lại khóa học vừa được nhắc tới";
  }
  if (/^\/course$/i.test(url)) {
    return "Duyệt danh sách khóa học hiện có";
  }
  return "Mở nhanh đúng mục trên FUJI";
}

function extractActionLinksFromMarkdown(markdown: string): {
  markdown: string;
  links: ActionLinkItem[];
} {
  let source = String(markdown || "");
  if (!source.trim()) {
    return { markdown: "", links: [] };
  }

  const links: ActionLinkItem[] = [];
  const seen = new Set<string>();

  source = source.replace(
    /`(\/[a-z0-9/_\-]+(?:\?[a-z0-9=&%._-]+)?)`/gi,
    (_match, rawUrl: string) => {
      const url = String(rawUrl || "").trim();
      if (!INTERNAL_URL_RE.test(url)) {
        return `\`${url}\``;
      }

      if (!seen.has(url)) {
        seen.add(url);
        links.push({
          label: inferActionLabelFromUrl(url),
          url,
          note: inferActionNoteFromUrl(url),
        });
      }

      return inferActionLabelFromUrl(url);
    },
  );

  source = source.replace(
    /\[([^\]]+)\]\((\/[a-z0-9/_\-]+(?:\?[a-z0-9=&%._-]+)?)\)/gi,
    (_match, rawLabel: string, rawUrl: string) => {
      const label = String(rawLabel || "").trim();
      const url = String(rawUrl || "").trim();

      if (INTERNAL_URL_RE.test(url) && !seen.has(url)) {
        seen.add(url);
        links.push({
          label: label || inferActionLabelFromUrl(url),
          url,
          note: inferActionNoteFromUrl(url),
        });
      }

      return label;
    },
  );

  source = source.replace(
    /(^|[\s:(])((\/[a-z0-9/_\-]+(?:\?[a-z0-9=&%._-]+)?))/gim,
    (_match, prefix: string, _all: string, rawUrl: string) => {
      const url = String(rawUrl || "").trim();
      if (!INTERNAL_URL_RE.test(url)) {
        return `${prefix}${url}`;
      }

      if (!seen.has(url)) {
        seen.add(url);
        links.push({
          label: inferActionLabelFromUrl(url),
          url,
          note: inferActionNoteFromUrl(url),
        });
      }

      return `${prefix}${inferActionLabelFromUrl(url)}`;
    },
  );

  source = source
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    markdown: source,
    links: sanitizeActionLinksPayload(links),
  };
}

function sanitizeNextStepsPayload(value: unknown): NextStepsPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawSteps = Array.isArray(record.steps) ? record.steps : [];
  const steps: NextStepsPayload["steps"] = [];

  for (const raw of rawSteps) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const step = raw as Record<string, unknown>;
    const label =
      typeof step.label === "string" && step.label.trim()
        ? step.label.trim()
        : typeof step.title === "string" && step.title.trim()
          ? step.title.trim()
          : "";

    const urlRaw = typeof step.url === "string" ? step.url.trim() : "";
    if (!label || !INTERNAL_URL_RE.test(urlRaw)) {
      continue;
    }

    const note =
      typeof step.note === "string" && step.note.trim()
        ? step.note.trim()
        : undefined;

    steps.push({
      label,
      url: urlRaw,
      note,
      icon: sanitizeIconName(step.icon),
    });
  }

  if (steps.length === 0) {
    return null;
  }

  const title =
    typeof record.title === "string" && record.title.trim()
      ? record.title.trim()
      : undefined;

  return {
    title,
    steps: steps.slice(0, 6),
  };
}

function sanitizePurchaseSummaryPayload(
  value: unknown,
): PurchaseSummaryPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  // walletAvailable: string "998 🌸" hoặc số 998
  let walletAvailable = "";
  if (typeof record.walletAvailable === "string" && record.walletAvailable.trim()) {
    walletAvailable = displayFlowerIcon(record.walletAvailable.trim());
  } else if (
    typeof record.walletAvailable === "number" &&
    Number.isFinite(record.walletAvailable)
  ) {
    walletAvailable = `${record.walletAvailable} 🌸`;
  }

  if (!walletAvailable) {
    return null;
  }

  const affordableCount =
    typeof record.affordableCount === "number" &&
    Number.isFinite(record.affordableCount) &&
    record.affordableCount >= 0
      ? record.affordableCount
      : 0;

  // cheapestAffordable: string "999 🌸" hoặc object {price: "999 🌸"}
  let cheapestAffordable: string | null = null;
  if (typeof record.cheapestAffordable === "string" && record.cheapestAffordable.trim()) {
    cheapestAffordable = displayFlowerIcon(record.cheapestAffordable.trim());
  } else if (record.cheapestAffordable && typeof record.cheapestAffordable === "object") {
    const obj = record.cheapestAffordable as Record<string, unknown>;
    if (typeof obj.price === "string" && obj.price.trim()) {
      cheapestAffordable = displayFlowerIcon(obj.price.trim());
    } else if (typeof obj.price === "number" && Number.isFinite(obj.price)) {
      cheapestAffordable = `${obj.price} 🌸`;
    }
  }

  // cheapestMissingAmount: string "2.002 🌸" hoặc số 2002
  let cheapestMissingAmount: string | null = null;
  if (
    typeof record.cheapestMissingAmount === "string" &&
    record.cheapestMissingAmount.trim()
  ) {
    cheapestMissingAmount = displayFlowerIcon(record.cheapestMissingAmount.trim());
  } else if (
    typeof record.cheapestMissingAmount === "number" &&
    record.cheapestMissingAmount > 0
  ) {
    cheapestMissingAmount = `${record.cheapestMissingAmount} 🌸`;
  }

  const ownedCount =
    typeof record.ownedCount === "number" &&
    Number.isFinite(record.ownedCount) &&
    record.ownedCount >= 0
      ? record.ownedCount
      : 0;

  const recommendedAction =
    record.recommendedAction === "topup" ||
    record.recommendedAction === "view_affordable"
      ? record.recommendedAction
      : affordableCount > 0
        ? "view_affordable"
        : "topup";

  return {
    walletAvailable,
    affordableCount,
    cheapestAffordable,
    cheapestMissingAmount,
    ownedCount,
    recommendedAction,
  };
}

function parseActionLinksMarkerBody(body: string): ActionLinkItem[] {
  const lines = String(body || "").split(/\r?\n/);
  const parsed: ActionLinkItem[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(
      /^[-*]\s*\[([^\]]+)\]\((\/[a-z0-9/_\-?=&%.]+)\)\s*(?:::\s*(.+))?$/i,
    );
    if (!match) continue;

    const label = String(match[1] || "").trim();
    const url = String(match[2] || "").trim();
    const note = String(match[3] || "").trim();

    if (!label || !url) continue;
    parsed.push({
      label,
      url,
      note: note || undefined,
    });
  }

  return sanitizeActionLinksPayload(parsed);
}

function splitActionLinksMarkerFromMarkdown(
  markdown: string,
): AssistantContentSegment[] {
  const source = String(markdown || "");
  if (!source.trim()) {
    return [];
  }

  const markerRegex = /@@@action-links\s*([\s\S]*?)@@@/gi;
  const segments: AssistantContentSegment[] = [];
  let cursor = 0;
  let found = false;

  while (true) {
    const match = markerRegex.exec(source);
    if (!match) break;

    found = true;
    const start = match.index;
    const end = markerRegex.lastIndex;

    if (start > cursor) {
      const before = source.slice(cursor, start).trim();
      if (before) {
        segments.push({ kind: "markdown", content: before });
      }
    }

    const links = parseActionLinksMarkerBody(match[1] || "");
    if (links.length > 0) {
      segments.push({ kind: "action-links", links });
    } else {
      const rawBlock = source.slice(start, end).trim();
      if (rawBlock) {
        segments.push({ kind: "markdown", content: rawBlock });
      }
    }

    cursor = end;
  }

  if (!found) {
    return [{ kind: "markdown", content: source.trim() }];
  }

  if (cursor < source.length) {
    const tail = source.slice(cursor).trim();
    if (tail) {
      segments.push({ kind: "markdown", content: tail });
    }
  }

  return segments;
}

function tryParseJsonValue(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function findBalancedJsonEnd(source: string, start: number): number {
  const first = source[start];
  if (first !== "[" && first !== "{") {
    return -1;
  }

  const closers: Record<string, string> = { "[": "]", "{": "}" };
  const stack: string[] = [closers[first]];
  let inString = false;
  let escaped = false;

  for (let i = start + 1; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "[" || ch === "{") {
      stack.push(closers[ch]);
      continue;
    }

    if (ch === "]" || ch === "}") {
      const expected = stack.pop();
      if (!expected || expected !== ch) {
        return -1;
      }
      if (stack.length === 0) {
        return i;
      }
    }
  }

  return -1;
}

function expandLooseJsonFromPlainText(text: string): AssistantContentSegment[] {
  const segments: AssistantContentSegment[] = [];
  let cursor = 0;
  let searchFrom = 0;

  while (searchFrom < text.length) {
    const nextArray = text.indexOf("[", searchFrom);
    const nextObject = text.indexOf("{", searchFrom);

    let start = -1;
    if (nextArray === -1) {
      start = nextObject;
    } else if (nextObject === -1) {
      start = nextArray;
    } else {
      start = Math.min(nextArray, nextObject);
    }

    if (start === -1) {
      break;
    }

    const end = findBalancedJsonEnd(text, start);
    if (end === -1) {
      searchFrom = start + 1;
      continue;
    }

    const jsonCandidate = text.slice(start, end + 1).trim();
    const parsed = tryParseJsonValue(jsonCandidate);
    let structured: AssistantContentSegment | null = null;

    const previewItems = sanitizeCoursePreviewItems(parsed);
    if (previewItems.length > 0) {
      structured = { kind: "course-preview", items: previewItems };
    } else {
      const comparePayload = sanitizeCourseComparePayload(parsed);
      if (comparePayload) {
        structured = { kind: "course-compare", payload: comparePayload };
      } else {
        const nextStepsPayload = sanitizeNextStepsPayload(parsed);
        if (nextStepsPayload) {
          structured = { kind: "next-steps", payload: nextStepsPayload };
        } else {
          const paymentPayload = sanitizePaymentActionPayload(parsed);
          if (paymentPayload) {
            structured = { kind: "payment-action", payload: paymentPayload };
          } else {
            const purchaseSummary = sanitizePurchaseSummaryPayload(parsed);
            if (purchaseSummary) {
              structured = {
                kind: "purchase-summary",
                payload: purchaseSummary,
              };
            } else {
              const actionLinks = sanitizeActionLinksPayload(parsed);
              if (actionLinks.length > 0) {
                structured = { kind: "action-links", links: actionLinks };
              }
            }
          }
        }
      }
    }

    if (structured) {
      const before = text.slice(cursor, start).trim();
      if (before) {
        segments.push({ kind: "markdown", content: before });
      }
      segments.push(structured);
      cursor = end + 1;
      searchFrom = end + 1;
      continue;
    }

    searchFrom = start + 1;
  }

  const tail = text.slice(cursor).trim();
  if (tail) {
    segments.push({ kind: "markdown", content: tail });
  }

  return segments.length > 0 ? segments : [{ kind: "markdown", content: text }];
}

function splitLooseJsonFromMarkdown(
  markdown: string,
): AssistantContentSegment[] {
  const source = String(markdown || "");
  if (!source.trim()) {
    return [];
  }

  const markerExpanded = splitActionLinksMarkerFromMarkdown(source);
  const finalSegments: AssistantContentSegment[] = [];

  for (const markerSegment of markerExpanded) {
    if (markerSegment.kind !== "markdown") {
      finalSegments.push(markerSegment);
      continue;
    }

    const text = String(markerSegment.content || "");
    if (!text.trim()) continue;

    const codeFenceRe = /```[\s\S]*?```/g;
    let cursor = 0;
    let foundCodeFence = false;
    let match: RegExpExecArray | null;

    while ((match = codeFenceRe.exec(text))) {
      foundCodeFence = true;
      const before = text.slice(cursor, match.index);
      if (before.trim()) {
        finalSegments.push(...expandLooseJsonFromPlainText(before));
      }

      const codeBlock = match[0].trim();
      if (codeBlock) {
        finalSegments.push({ kind: "markdown", content: codeBlock });
      }

      cursor = codeFenceRe.lastIndex;
    }

    const tail = text.slice(cursor);
    if (tail.trim()) {
      finalSegments.push(...expandLooseJsonFromPlainText(tail));
    }

    if (!foundCodeFence && !tail.trim()) {
      finalSegments.push({ kind: "markdown", content: text });
    }
  }

  return finalSegments;
}

function stripIncompleteStructuredBlock(source: string): {
  visibleSource: string;
  pendingBlockType: StructuredBlockType | null;
} {
  const openBlockRegex =
    /```(course-preview|course-compare|payment-action|action-links|quick-facts|purchase-summary|next-steps)\s*/gi;
  let match: RegExpExecArray | null;

  while ((match = openBlockRegex.exec(source))) {
    const blockType = String(
      match[1] || "",
    ).toLowerCase() as StructuredBlockType;
    const blockBodyStart = openBlockRegex.lastIndex;
    const closeIndex = source.indexOf("```", blockBodyStart);

    if (closeIndex === -1) {
      return {
        visibleSource: source.slice(0, match.index),
        pendingBlockType: blockType,
      };
    }

    openBlockRegex.lastIndex = closeIndex + 3;
  }

  const markerRegex = /@@@action-links\s*/gi;
  let markerMatch: RegExpExecArray | null;

  while ((markerMatch = markerRegex.exec(source))) {
    const bodyStart = markerRegex.lastIndex;
    const closeIndex = source.indexOf("@@@", bodyStart);

    if (closeIndex === -1) {
      return {
        visibleSource: source.slice(0, markerMatch.index),
        pendingBlockType: "action-links",
      };
    }

    markerRegex.lastIndex = closeIndex + 3;
  }

  return {
    visibleSource: source,
    pendingBlockType: null,
  };
}

export function parseAssistantContent(
  rawContent: string,
  options?: { streaming?: boolean },
): AssistantContentSegment[] {
  const source = String(rawContent || "");
  if (!source) {
    return [];
  }

  const { visibleSource, pendingBlockType } = options?.streaming
    ? stripIncompleteStructuredBlock(source)
    : { visibleSource: source, pendingBlockType: null };

  const re =
    /```(course-preview|course-compare|payment-action|action-links|quick-facts|purchase-summary|next-steps)\s*([\s\S]*?)```/gi;
  const segments: AssistantContentSegment[] = [];
  let cursor = 0;
  let droppedStructuredBlock = false;

  while (true) {
    const match = re.exec(visibleSource);
    if (!match) {
      break;
    }

    const start = match.index;
    const end = re.lastIndex;
    if (start > cursor) {
      const markdown = visibleSource.slice(cursor, start).trim();
      if (markdown) {
        segments.push({ kind: "markdown", content: markdown });
      }
    }

    const blockType = String(match[1] || "")
      .trim()
      .toLowerCase();
    const jsonText = (match[2] || "").trim();
    const parsed = tryParseJsonValue(jsonText);

    if (blockType === "course-preview") {
      const items = sanitizeCoursePreviewItems(parsed);
      if (items.length > 0) {
        segments.push({ kind: "course-preview", items });
      } else {
        const rawBlock = visibleSource.slice(start, end).trim();
        if (rawBlock) {
          segments.push({ kind: "markdown", content: rawBlock });
        }
      }
    } else if (blockType === "course-compare") {
      const payload = sanitizeCourseComparePayload(parsed);
      if (payload) {
        segments.push({ kind: "course-compare", payload });
      } else {
        const rawBlock = visibleSource.slice(start, end).trim();
        if (rawBlock) {
          segments.push({ kind: "markdown", content: rawBlock });
        }
      }
    } else if (blockType === "payment-action") {
      const payload = sanitizePaymentActionPayload(parsed);
      if (payload) {
        segments.push({ kind: "payment-action", payload });
      } else {
        const rawBlock = visibleSource.slice(start, end).trim();
        if (rawBlock) {
          segments.push({ kind: "markdown", content: rawBlock });
        }
      }
    } else if (blockType === "action-links") {
      const links = sanitizeActionLinksPayload(parsed);
      if (links.length > 0) {
        segments.push({ kind: "action-links", links });
      } else {
        const rawBlock = visibleSource.slice(start, end).trim();
        if (rawBlock) {
          segments.push({ kind: "markdown", content: rawBlock });
        }
      }
    } else if (blockType === "quick-facts") {
      droppedStructuredBlock = true;
    } else if (blockType === "purchase-summary") {
      const payload = sanitizePurchaseSummaryPayload(parsed);
      if (payload) {
        segments.push({ kind: "purchase-summary", payload });
      } else {
        const rawBlock = visibleSource.slice(start, end).trim();
        if (rawBlock) {
          segments.push({ kind: "markdown", content: rawBlock });
        }
      }
    } else if (blockType === "next-steps") {
      const payload = sanitizeNextStepsPayload(parsed);
      if (payload) {
        segments.push({ kind: "next-steps", payload });
      } else {
        const rawBlock = visibleSource.slice(start, end).trim();
        if (rawBlock) {
          segments.push({ kind: "markdown", content: rawBlock });
        }
      }
    } else {
      const rawBlock = visibleSource.slice(start, end).trim();
      if (rawBlock) {
        segments.push({ kind: "markdown", content: rawBlock });
      }
    }

    cursor = end;
  }

  if (cursor < visibleSource.length) {
    const markdown = visibleSource.slice(cursor).trim();
    if (markdown) {
      segments.push({ kind: "markdown", content: markdown });
    }
  }

  const normalized: AssistantContentSegment[] = [];
  for (const segment of segments) {
    if (segment.kind !== "markdown") {
      normalized.push(segment);
      continue;
    }

    const expanded = splitLooseJsonFromMarkdown(segment.content);
    if (expanded.length > 0) {
      normalized.push(...expanded);
    }
  }

  const transformed: AssistantContentSegment[] = [];
  for (const segment of normalized) {
    if (segment.kind !== "markdown") {
      transformed.push(segment);
      continue;
    }

    const extracted = extractActionLinksFromMarkdown(segment.content);
    if (extracted.markdown) {
      transformed.push({ kind: "markdown", content: extracted.markdown });
    }
    if (extracted.links.length > 0) {
      transformed.push({ kind: "action-links", links: extracted.links });
    }
  }

  const finalSegments = transformed.length > 0 ? transformed : normalized;

  if (finalSegments.length === 0) {
    if (droppedStructuredBlock) {
      return [];
    }
    if (pendingBlockType && pendingBlockType !== "quick-facts") {
      return [{ kind: "structured-loading", blockType: pendingBlockType }];
    }
    return visibleSource.trim() ? [{ kind: "markdown", content: visibleSource }] : [];
  }

  if (pendingBlockType && pendingBlockType !== "quick-facts") {
    finalSegments.push({
      kind: "structured-loading",
      blockType: pendingBlockType,
    });
  }

  return finalSegments;
}
