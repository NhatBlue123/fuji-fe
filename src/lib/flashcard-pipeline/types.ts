/**
 * Flashcard Creation Pipeline — Type Definitions
 *
 * Simplified state machine per term:
 *   IDLE → PARSING → DETECTING → READY
 *   READY → (user clicks search) → SEARCHING_IMAGES → DONE / NO_RESULTS
 *   any state → ERROR
 */

// ─── Term processing states ───────────────────────────
export type TermStatus =
  | "idle"
  | "parsing"
  | "detecting"
  | "ready"
  | "searching_images"
  | "done"
  | "no_results"
  | "error";

// ─── Language detection result ────────────────────────
export type DetectedLanguage = "ja" | "en" | "vi" | "other";

// ─── A single image result ───────────────────────────
export interface ImageResult {
  url: string;
  thumbnailUrl: string;
  title: string;
  width?: number;
  height?: number;
}

// ─── The full state of a single term in the pipeline ─
export interface TermState {
  /** Unique key (index-based, stable across re-parses) */
  key: string;
  /** Raw input text for this term */
  raw: string;
  /** Parsed vocabulary (front of card) */
  vocabulary: string;
  /** Parsed meaning if user provided (back of card) */
  meaning: string;
  /** Current processing status */
  status: TermStatus;
  /** Detected language */
  language: DetectedLanguage | null;
  /** The query used for image search (Japanese term) */
  imageQuery: string | null;
  /** Image search results */
  images: ImageResult[];
  /** Error message if status === 'error' */
  errorMessage: string | null;
}

// ─── Pipeline configuration ──────────────────────────
export interface PipelineConfig {
  /** Debounce delay in ms for input changes (default: 400) */
  debounceMs: number;
  /** Max concurrent network tasks (default: 4) */
  maxConcurrency: number;
  /** Max image results to fetch per term (default: 10) */
  maxImages: number;
  /** Image search timeout in ms (default: 8000) */
  imageSearchTimeoutMs: number;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  debounceMs: 400,
  maxConcurrency: 4,
  maxImages: 10,
  imageSearchTimeoutMs: 8000,
};
