/**
 * useFlashcardPipeline — React hook wrapping FlashcardPipeline.
 *
 * Provides reactive state for all terms and their processing status.
 * Automatically cancels/restarts when input changes.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FlashcardPipeline,
  type TermState,
  type PipelineConfig,
} from "@/lib/flashcard-pipeline";

export interface UseFlashcardPipelineReturn {
  /** Current term states with progressive status */
  terms: TermState[];
  /** Whether any term is still processing */
  isProcessing: boolean;
  /** Number of terms that completed successfully */
  doneCount: number;
  /** Number of terms ready for image search */
  readyCount: number;
  /** Total terms parsed */
  totalCount: number;
  /** Manually trigger processing for the current input */
  processNow: () => void;
  /** Search images for a single term by its key */
  searchImagesForTerm: (termKey: string) => void;
  /** Search images for all terms in "ready" state */
  searchAllImages: () => void;
  /** Reset all state */
  reset: () => void;
}

export function useFlashcardPipeline(
  input: string,
  config: Partial<PipelineConfig> = {},
): UseFlashcardPipelineReturn {
  const [terms, setTerms] = useState<TermState[]>([]);
  const pipelineRef = useRef<FlashcardPipeline | null>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  // Create pipeline once
  useEffect(() => {
    const pipeline = new FlashcardPipeline(config);
    pipeline.onUpdate(setTerms);
    pipelineRef.current = pipeline;

    return () => {
      pipeline.destroy();
      pipelineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Pipeline is created once; config changes are rare

  // Process input changes (debounced inside pipeline)
  useEffect(() => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    if (input.trim()) {
      pipeline.processInput(input);
    } else {
      pipeline.reset();
    }
  }, [input]);

  const processNow = useCallback(() => {
    const pipeline = pipelineRef.current;
    if (pipeline && inputRef.current.trim()) {
      pipeline.processInputImmediate(inputRef.current);
    }
  }, []);

  const searchImagesForTerm = useCallback((termKey: string) => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;
    const terms = pipeline.getTerms();
    const index = terms.findIndex((t) => t.key === termKey);
    if (index >= 0) {
      pipeline.searchImagesForTerm(index);
    }
  }, []);

  const searchAllImages = useCallback(() => {
    pipelineRef.current?.searchAllImages();
  }, []);

  const reset = useCallback(() => {
    pipelineRef.current?.reset();
  }, []);

  const isProcessing = terms.some(
    (t) =>
      t.status === "parsing" ||
      t.status === "detecting" ||
      t.status === "searching_images",
  );

  const doneCount = terms.filter((t) => t.status === "done").length;
  const readyCount = terms.filter((t) => t.status === "ready").length;

  return {
    terms,
    isProcessing,
    doneCount,
    readyCount,
    totalCount: terms.length,
    processNow,
    searchImagesForTerm,
    searchAllImages,
    reset,
  };
}
