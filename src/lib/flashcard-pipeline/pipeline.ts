/**
 * Flashcard Pipeline Orchestrator
 *
 * Manages the lifecycle of parsing → detecting language → ready (for image search).
 * Image search is triggered manually by the user to save API quota.
 *
 * Logic:
 *   - Parse multi-line input into vocabulary/meaning pairs
 *   - Detect which side is Japanese
 *   - Use the Japanese term as the image search keyword
 *   - No translation needed — search directly in Japanese on irasutoya.com
 *
 * Architecture:
 *
 *   User types input
 *         │
 *         ▼ (debounced)
 *   parseTerms(input)
 *         │
 *         ▼ (for each term)
 *   ┌─────────────────┐
 *   │  detectLanguage  │
 *   └────────┬────────┘
 *            │
 *            ▼
 *       Pick Japanese side as imageQuery
 *            │
 *            ▼
 *       READY (waiting for user)
 *            │
 *            ▼ (user clicks search button)
 *     ┌─────────────┐
 *     │ searchImages │ (calls BE API)
 *     └──────┬──────┘
 *            │
 *            ▼
 *     DONE / NO_RESULTS / ERROR
 */

import type { TermState, PipelineConfig, DetectedLanguage } from "./types";
import { DEFAULT_PIPELINE_CONFIG } from "./types";
import { parseTerms } from "./parser";
import { detectLanguage } from "./detectLanguage";
import { searchImages } from "./imageSearch";
import { ConcurrencyLimiter } from "./concurrency";

// ─── Pipeline class ──────────────────────────────────

export type TermStateListener = (terms: TermState[]) => void;

export class FlashcardPipeline {
  private config: PipelineConfig;
  private terms: TermState[] = [];
  private listener: TermStateListener | null = null;
  private abortController: AbortController | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private limiter: ConcurrencyLimiter;
  private generationId = 0; // increments on each new input to discard stale results

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
    this.limiter = new ConcurrencyLimiter(this.config.maxConcurrency);
  }

  /** Subscribe to state changes */
  onUpdate(listener: TermStateListener) {
    this.listener = listener;
  }

  /** Get current terms snapshot */
  getTerms(): TermState[] {
    return [...this.terms];
  }

  /** Process new input (debounced) */
  processInput(input: string) {
    // Clear previous debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.executeProcessing(input);
    }, this.config.debounceMs);
  }

  /** Process immediately without debounce */
  processInputImmediate(input: string) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.executeProcessing(input);
  }

  /** Cancel all in-flight operations */
  cancel() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.limiter.clear();
  }

  /** Reset everything */
  reset() {
    this.cancel();
    this.terms = [];
    this.generationId++;
    this.notify();
  }

  /** Destroy the pipeline (cleanup) */
  destroy() {
    this.cancel();
    this.listener = null;
  }

  /** Manually trigger image search for a specific term (by index) */
  async searchImagesForTerm(index: number): Promise<void> {
    const term = this.terms[index];
    if (!term) return;
    if (term.status === "searching_images" || term.status === "done") return;

    const generation = this.generationId;
    const abortController = new AbortController();
    const signal = abortController.signal;
    const imageQuery = term.imageQuery || term.vocabulary;

    this.updateTerm(index, generation, {
      status: "searching_images",
      imageQuery,
    });

    try {
      const images = await searchImages(imageQuery, {
        signal,
        timeoutMs: this.config.imageSearchTimeoutMs,
        maxResults: this.config.maxImages,
      });
      if (generation !== this.generationId) return;

      this.updateTerm(index, generation, {
        images,
        status: images.length > 0 ? "done" : "no_results",
      });
    } catch (err) {
      if (signal.aborted || generation !== this.generationId) return;
      console.warn(`Image search failed for "${imageQuery}":`, err);
      this.updateTerm(index, generation, {
        status: "no_results",
        imageQuery,
      });
    }
  }

  /** Search images for all terms that are in "ready" state */
  async searchAllImages(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (let i = 0; i < this.terms.length; i++) {
      if (
        this.terms[i].status === "ready" ||
        this.terms[i].status === "no_results"
      ) {
        promises.push(this.limiter.run(() => this.searchImagesForTerm(i)));
      }
    }
    await Promise.allSettled(promises);
  }

  // ─── Internal ────────────────────────────────────────

  private executeProcessing(input: string) {
    // Cancel any previous processing
    if (this.abortController) {
      this.abortController.abort();
    }
    this.limiter.clear();

    const generation = ++this.generationId;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Parse terms
    const parsed = parseTerms(input);

    // Build initial TermState array, reusing existing state where term hasn't changed
    const newTerms: TermState[] = parsed.map((p, i) => {
      const key = `term-${i}`;
      const existing = this.terms.find(
        (t) =>
          t.key === key &&
          t.vocabulary === p.vocabulary &&
          t.meaning === p.meaning &&
          t.pronunciation === p.pronunciation &&
          t.exampleSentence === p.exampleSentence,
      );
      if (existing && existing.status === "done") {
        // Term hasn't changed and was already processed — keep it
        return existing;
      }
      const rawDetails = [
        p.meaning,
        p.pronunciation,
        p.exampleSentence,
      ].filter(Boolean);
      return {
        key,
        raw: `${p.vocabulary}${rawDetails.length ? ` - ${rawDetails.join(" - ")}` : ""}`,
        vocabulary: p.vocabulary,
        meaning: p.meaning,
        pronunciation: p.pronunciation,
        exampleSentence: p.exampleSentence,
        status: "parsing" as const,
        language: null,
        imageQuery: null,
        images: [],
        errorMessage: null,
      };
    });

    this.terms = newTerms;
    this.notify();

    // Process each term that needs processing
    for (let i = 0; i < newTerms.length; i++) {
      const term = newTerms[i];
      if (term.status === "done" || term.status === "no_results") {
        continue; // Already processed, skip
      }

      // Process term with concurrency limiting
      this.limiter.run(() => this.processSingleTerm(i, generation, signal));
    }
  }

  private async processSingleTerm(
    index: number,
    generation: number,
    signal: AbortSignal,
  ): Promise<void> {
    // Check if this generation is still current
    if (generation !== this.generationId || signal.aborted) return;

    const term = this.terms[index];
    if (!term) return;

    try {
      // Step 1: Detect language of vocabulary
      this.updateTerm(index, generation, { status: "detecting" });

      const vocabDetection = detectLanguage(term.vocabulary);
      if (generation !== this.generationId || signal.aborted) return;

      // Step 2: Determine which side is Japanese for image search
      // If vocabulary is Japanese → use it as imageQuery
      // If meaning is Japanese → use meaning as imageQuery
      // Otherwise use vocabulary as fallback
      let imageQuery = term.vocabulary;
      let detectedLang = vocabDetection.language;

      if (vocabDetection.language === "ja") {
        imageQuery = term.vocabulary;
      } else if (term.meaning) {
        const meaningDetection = detectLanguage(term.meaning);
        if (meaningDetection.language === "ja") {
          imageQuery = term.meaning;
          detectedLang = "ja" as const;
        }
      }

      this.updateTerm(index, generation, {
        language: detectedLang,
        status: "ready",
        imageQuery,
      });
    } catch (err) {
      if (signal.aborted || generation !== this.generationId) return;
      this.updateTerm(index, generation, {
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  private updateTerm(
    index: number,
    generation: number,
    patch: Partial<TermState>,
  ) {
    if (generation !== this.generationId) return;
    if (index < 0 || index >= this.terms.length) return;

    this.terms[index] = { ...this.terms[index], ...patch };
    this.notify();
  }

  private notify() {
    if (this.listener) {
      this.listener([...this.terms]);
    }
  }
}

// ─── Status helpers ──────────────────────────────────

export const STATUS_LABELS: Record<TermState["status"], string> = {
  idle: "Chờ xử lý",
  parsing: "Đang phân tích...",
  detecting: "Nhận diện ngôn ngữ...",
  ready: "Sẵn sàng tìm ảnh",
  searching_images: "Tìm hình ảnh...",
  done: "Hoàn tất",
  no_results: "Không tìm thấy hình ảnh",
  error: "Lỗi",
};

export const LANGUAGE_LABELS: Record<DetectedLanguage, string> = {
  ja: "🇯🇵 Tiếng Nhật",
  en: "🇬🇧 English",
  vi: "🇻🇳 Tiếng Việt",
  other: "Khác",
};
