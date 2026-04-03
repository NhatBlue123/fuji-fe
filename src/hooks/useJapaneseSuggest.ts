"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toHiragana, isRomaji } from "wanakana";

/* ─── Types ─────────────────────────────────────────────────────────── */
export type JapaneseSuggestion = {
  word: string;       // kanji or kana form
  reading?: string;   // hiragana reading
  meaning?: string;   // english meaning
  fromHistory?: boolean;
  scriptType?: "HIRAGANA" | "KANJI" | "OTHER";
};

type CacheEntry = {
  ts: number;
  items: JapaneseSuggestion[];
};

/* ─── Constants ─────────────────────────────────────────────────────── */
const HISTORY_KEY = "jp_suggest_history";
const MAX_HISTORY = 80;
const CACHE_TTL = 5 * 60 * 1000; // 5 min in-memory cache
const DEBOUNCE_MS = 120;

/* ─── localStorage helpers ──────────────────────────────────────────── */
function loadHistory(): JapaneseSuggestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as JapaneseSuggestion[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: JapaneseSuggestion[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    /* quota exceeded — ignore */
  }
}

/* ─── Hook ──────────────────────────────────────────────────────────── */
export function useJapaneseSuggest() {
  const [suggestions, setSuggestions] = useState<JapaneseSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // In-memory API cache (keyword → results)
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const historyRef = useRef<JapaneseSuggestion[]>(loadHistory());

  /* ── Convert romaji input to hiragana (local, instant) ────────────── */
  const convertToHiragana = useCallback((text: string): string => {
    try {
      return toHiragana(text, { passRomaji: false });
    } catch {
      return text;
    }
  }, []);

  /* ── Convert full sentence: romaji → hiragana ─────────────────────── */
  const convertSentence = useCallback(
    (text: string): string => {
      // Split by spaces, convert each token, rejoin
      return text
        .split(/\s+/)
        .map((token) => {
          if (isRomaji(token)) return convertToHiragana(token);
          return token; // already Japanese
        })
        .join("");
    },
    [convertToHiragana],
  );

  /* ── Fetch from Jisho API (with cache) ────────────────────────────── */
  const fetchJisho = useCallback(
    async (keyword: string, signal?: AbortSignal): Promise<JapaneseSuggestion[]> => {
      if (!keyword) return [];

      // Check cache
      const cached = cacheRef.current.get(keyword);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.items;
      }

      const res = await fetch(
        `/api/jisho/search?keyword=${encodeURIComponent(keyword)}`,
        { signal },
      );
      const json = await res.json().catch(() => ({}));
      const items: JapaneseSuggestion[] = (json?.suggestions ?? []).slice(0, 8);

      // Store in cache
      cacheRef.current.set(keyword, { ts: Date.now(), items });
      return items;
    },
    [],
  );

  /* ── Match history items by prefix ────────────────────────────────── */
  const matchHistory = useCallback((input: string): JapaneseSuggestion[] => {
    if (!input) return [];
    const lower = input.toLowerCase();
    const hiragana = convertToHiragana(input);

    return historyRef.current
      .filter((h) => {
        const w = h.word.toLowerCase();
        const r = (h.reading ?? "").toLowerCase();
        return (
          w.startsWith(lower) ||
          w.startsWith(hiragana) ||
          r.startsWith(lower) ||
          r.startsWith(hiragana)
        );
      })
      .slice(0, 4)
      .map((h) => ({ ...h, fromHistory: true }));
  }, [convertToHiragana]);

  /* ── Add selected word to history ─────────────────────────────────── */
  const addToHistory = useCallback((item: JapaneseSuggestion) => {
    const existing = historyRef.current;
    // Remove duplicate
    const filtered = existing.filter(
      (h) => h.word !== item.word || h.reading !== item.reading,
    );
    const updated: JapaneseSuggestion[] = [
      { word: item.word, reading: item.reading, meaning: item.meaning },
      ...filtered,
    ].slice(0, MAX_HISTORY);
    historyRef.current = updated;
    saveHistory(updated);
  }, []);

  /* ── Trigger suggestion lookup (debounced) ────────────────────────── */
  const triggerSuggest = useCallback(
    (rawInput: string) => {
      // Cancel previous
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();

      const keyword = rawInput.trim();
      if (!keyword) {
        setSuggestions([]);
        setIsOpen(false);
        setSelectedIndex(-1);
        return;
      }

      // Avoid spamming API for too-short latin tokens
      const hasLatin = /[a-zA-Z]/.test(keyword);
      if (hasLatin && keyword.length < 2) {
        setIsLoading(false);
        return;
      }

      // Instant: show history matches
      const historyMatches = matchHistory(keyword);
      const instant: JapaneseSuggestion[] = [];

      // For romaji input, always show a direct hiragana option first.
      if (hasLatin) {
        const hira = convertToHiragana(keyword);
        if (hira && hira !== keyword) {
          instant.push({
            word: hira,
            reading: hira,
            meaning: "Hiragana",
            scriptType: "HIRAGANA",
          });
        }
      }

      if (historyMatches.length > 0) {
        instant.push(...historyMatches);
      }

      if (instant.length > 0) {
        // Deduplicate while preserving order
        const seen = new Set<string>();
        const dedupInstant = instant.filter((s) => {
          const key = `${s.word}|${s.reading ?? ""}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setSuggestions(dedupInstant.slice(0, 10));
        setIsOpen(true);
        setSelectedIndex(-1);
      }

      // Check if input contains latin chars → convert to hiragana for Jisho
      const searchKeyword = hasLatin ? convertToHiragana(keyword) : keyword;

      debounceRef.current = window.setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          setIsLoading(true);
          const apiResults = await fetchJisho(searchKeyword, controller.signal);

          // Merge: instant (hira/history) first, then API (deduplicated)
          const mergedRaw = [...instant, ...apiResults];
          const seen = new Set<string>();
          const merged = mergedRaw.filter((s) => {
            const key = `${s.word}|${s.reading ?? ""}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).slice(0, 10);

          setSuggestions(merged);
          setIsOpen(merged.length > 0);
          setSelectedIndex(-1);
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          // On error, keep history matches if any
          if (historyMatches.length === 0) {
            setSuggestions([]);
            setIsOpen(false);
          }
        } finally {
          setIsLoading(false);
        }
      }, DEBOUNCE_MS);
    },
    [matchHistory, convertToHiragana, fetchJisho],
  );

  /* ── Build full-sentence suggestion ───────────────────────────────── */
  const buildSentenceSuggestion = useCallback(
    (rawInput: string): JapaneseSuggestion | null => {
      const trimmed = rawInput.trim();
      if (!trimmed) return null;

      // Only if it looks like a multi-word romaji sentence
      const words = trimmed.split(/\s+/);
      if (words.length < 2) return null;
      if (!words.some((w) => isRomaji(w))) return null;

      const converted = convertSentence(trimmed);
      if (converted === trimmed) return null; // nothing changed

      return {
        word: converted,
        reading: converted,
        meaning: `Câu: ${trimmed}`,
      };
    },
    [convertSentence],
  );

  /* ── Handle Ctrl+Space ────────────────────────────────────────────── */
  const handleCtrlSpace = useCallback(
    (rawInput: string) => {
      const keyword = rawInput.trim();
      if (!keyword) return;

      // Build sentence suggestion if multi-word
      const sentenceSugg = buildSentenceSuggestion(keyword);

      // Also get history matches instantly
      const historyMatches = matchHistory(keyword);

      const instant: JapaneseSuggestion[] = [];
      if (sentenceSugg) instant.push(sentenceSugg);
      instant.push(...historyMatches);

      if (instant.length > 0) {
        setSuggestions(instant);
        setIsOpen(true);
        setSelectedIndex(-1);
      }

      // Also trigger API lookup
      triggerSuggest(keyword);
    },
    [buildSentenceSuggestion, matchHistory, triggerSuggest],
  );

  /* ── Select a suggestion ──────────────────────────────────────────── */
  const selectSuggestion = useCallback(
    (item: JapaneseSuggestion): string => {
      addToHistory(item);
      setSuggestions([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return item.word;
    },
    [addToHistory],
  );

  /* ── Keyboard handler (call from onKeyDown) ───────────────────────── */
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      rawInput: string,
      onSelect: (text: string) => void,
      onSend: () => void,
    ) => {
      // Ctrl+Space → open suggestions
      if (e.key === " " && e.ctrlKey) {
        e.preventDefault();
        handleCtrlSpace(rawInput);
        return;
      }

      if (!isOpen || suggestions.length === 0) {
        // Normal Enter → send
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSend();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) =>
            i < suggestions.length - 1 ? i + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) =>
            i > 0 ? i - 1 : suggestions.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            const text = selectSuggestion(suggestions[selectedIndex]);
            onSelect(text);
          } else {
            onSend();
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
        case "Tab":
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            e.preventDefault();
            const text = selectSuggestion(suggestions[selectedIndex]);
            onSelect(text);
          }
          break;
      }
    },
    [isOpen, suggestions, selectedIndex, handleCtrlSpace, selectSuggestion],
  );

  /* ── Close dropdown ───────────────────────────────────────────────── */
  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
    setSelectedIndex(-1);
  }, []);

  /* ── Cleanup on unmount ───────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return {
    suggestions,
    isOpen,
    isLoading,
    selectedIndex,
    triggerSuggest,
    handleCtrlSpace,
    selectSuggestion,
    handleKeyDown,
    closeSuggestions,
    convertToHiragana,
    convertSentence,
    setIsOpen,
  };
}
