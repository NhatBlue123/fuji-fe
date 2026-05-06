/**
 * Image Search Service
 *
 * Calls the Spring Boot backend `/api/media/image-search` endpoint
 * which proxies to Serper.dev Images API with site:www.irasutoya.com filter.
 *
 * Features:
 *   - Per-term image cache (module-level)
 *   - AbortController support
 *   - Timeout handling
 *   - Returns up to maxImages results
 */

import type { ImageResult } from "./types";
import { getAccessToken } from "@/lib/token";

// Backend API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8181/api";

// ─── Image cache (module-level singleton) ─────────────
const imageCache = new Map<string, ImageResult[]>();
const MAX_IMAGE_CACHE = 300;

function setCachedImages(key: string, images: ImageResult[]) {
  if (imageCache.size >= MAX_IMAGE_CACHE) {
    const keys = Array.from(imageCache.keys());
    const removeCount = Math.floor(MAX_IMAGE_CACHE * 0.25);
    for (let i = 0; i < removeCount; i++) {
      imageCache.delete(keys[i]);
    }
  }
  imageCache.set(key, images);
}

// ─── Main search function ─────────────────────────────

export interface ImageSearchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  maxResults?: number;
}

/**
 * Search images for a given query.
 * Calls Spring Boot backend /api/media/image-search.
 */
export async function searchImages(
  query: string,
  options: ImageSearchOptions = {},
): Promise<ImageResult[]> {
  const { signal, timeoutMs = 8000, maxResults = 10 } = options;

  if (!query.trim()) return [];

  const cacheKey = query.toLowerCase().trim();
  const cached = imageCache.get(cacheKey);
  if (cached) return cached;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  const combinedSignal = signal
    ? combineAbortSignals(signal, timeoutController.signal)
    : timeoutController.signal;

  try {
    const images = await fetchFromProxy(query, maxResults, combinedSignal);
    setCachedImages(cacheKey, images);
    return images;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Fetch from Spring Boot backend ───────────────────

async function fetchFromProxy(
  query: string,
  maxResults: number,
  signal: AbortSignal,
): Promise<ImageResult[]> {
  const params = new URLSearchParams({
    q: query,
    num: String(Math.min(maxResults, 10)),
  });

  const res = await fetch(`${API_BASE}/media/image-search?${params}`, {
    headers: authHeaders(),
    credentials: "include",
    signal,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Image search failed: ${res.status} ${errBody}`);
  }

  const json = await res.json();

  // BE wraps in ApiResponse: { success, data: { items, totalResults } }
  const data = json.data || json;

  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }

  return data.items.map(
    (item: {
      imageUrl?: string;
      thumbnailUrl?: string;
      title?: string;
      width?: number;
      height?: number;
      cloudinaryPublicId?: string;
      sourceUrl?: string;
    }) => ({
      url: item.imageUrl || "",
      thumbnailUrl: item.thumbnailUrl || item.imageUrl || "",
      title: item.title || "",
      width: item.width,
      height: item.height,
      cloudinaryPublicId: item.cloudinaryPublicId,
      sourceUrl: item.sourceUrl,
    }),
  );
}

// ─── Utility: Combine AbortSignals ───────────────────

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) {
      controller.abort(sig.reason);
      return controller.signal;
    }
    sig.addEventListener("abort", () => controller.abort(sig.reason), {
      once: true,
    });
  }
  return controller.signal;
}

// ─── Export cache utils for testing ───────────────────

export function clearImageCache() {
  imageCache.clear();
}

export function getImageCacheSize(): number {
  return imageCache.size;
}

// ─── Resolve: upload single image to Cloudinary on select ─

export interface ResolvedImage {
  cloudinaryUrl: string;
  cloudinaryPublicId: string | null;
  sourceUrl: string;
  cacheHit: boolean;
}

/**
 * Resolve a single external image URL to a Cloudinary URL.
 * Called when user selects an image from search results.
 * Backend checks cache first; uploads to Cloudinary only if not cached.
 */
export async function resolveImage(
  sourceUrl: string,
  signal?: AbortSignal,
): Promise<ResolvedImage> {
  const res = await fetch(`${API_BASE}/media/resolve-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify({ sourceUrl }),
    signal,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Resolve image failed: ${res.status} ${errBody}`);
  }

  const json = await res.json();
  const data = json.data || json;

  return {
    cloudinaryUrl: data.cloudinaryUrl || sourceUrl,
    cloudinaryPublicId: data.cloudinaryPublicId || null,
    sourceUrl: data.sourceUrl || sourceUrl,
    cacheHit: data.cacheHit ?? false,
  };
}

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
