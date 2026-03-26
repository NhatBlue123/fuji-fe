import { NextRequest, NextResponse } from "next/server";

type JishoApiJapanese = {
  word?: string;
  reading?: string;
};

type JishoApiSense = {
  english_definitions?: string[];
};

type JishoApiResult = {
  japanese?: JishoApiJapanese[];
  senses?: JishoApiSense[];
};

type Suggestion = {
  word: string;
  reading?: string;
  meaning?: string;
  scriptType?: "HIRAGANA" | "KANJI" | "OTHER";
};

/* ── In-memory server-side cache (per-instance) ─────────────────────── */
const serverCache = new Map<string, { ts: number; data: Suggestion[] }>();
const SERVER_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function cleanCache() {
  const now = Date.now();
  for (const [key, entry] of serverCache) {
    if (now - entry.ts > SERVER_CACHE_TTL) serverCache.delete(key);
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const keyword = (url.searchParams.get("keyword") ?? "").trim();

  if (!keyword) {
    return NextResponse.json({ suggestions: [] });
  }

  // Check server cache
  cleanCache();
  const cached = serverCache.get(keyword);
  if (cached) {
    return NextResponse.json(
      { suggestions: cached.data },
      {
        headers: {
          "Cache-Control": "public, max-age=180, stale-while-revalidate=60",
        },
      },
    );
  }

  try {
    const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(
      keyword,
    )}`;

    const res = await fetch(jishoUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      // Allow Next.js to cache upstream for 3 min
      next: { revalidate: 180 },
    });

    const json = await res.json().catch(() => ({}));
    const data: JishoApiResult[] = json?.data ?? [];

    const seen = new Set<string>();
    const suggestions: Suggestion[] = [];

    for (const item of data.slice(0, 12)) {
      const meaning = item.senses?.[0]?.english_definitions?.join(", ") ?? "";
      const jpList = item.japanese ?? [];

      for (const jp of jpList.slice(0, 2)) {
        const word = jp.word ?? jp.reading ?? "";
        const reading = jp.reading;
        if (!word) continue;

        const scriptType: Suggestion["scriptType"] =
          jp.word && jp.word !== jp.reading ? "KANJI" : "HIRAGANA";

        const key = `${word}|${reading ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);

        suggestions.push({
          word,
          reading,
          meaning,
          scriptType,
        });

        if (suggestions.length >= 10) break;
      }
      if (suggestions.length >= 10) break;
    }

    // Store in server cache
    serverCache.set(keyword, { ts: Date.now(), data: suggestions });

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "Cache-Control": "public, max-age=180, stale-while-revalidate=60",
        },
      },
    );
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
