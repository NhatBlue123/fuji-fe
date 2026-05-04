/**
 * Term Parser — parses user input into vocabulary/meaning pairs.
 *
 * Supported formats:
 *   "vocabulary - meaning"
 *   "vocabulary - meaning - pronunciation"
 *   "vocabulary - meaning - pronunciation - example sentence"
 *   "vocabulary | meaning | pronunciation | example sentence"
 *   "vocabulary: meaning"
 *   "vocabulary"  (meaning left empty)
 *
 * Handles the Vietnamese-style format "từ: - 'từ'" as well.
 */

export interface ParsedTerm {
  vocabulary: string;
  meaning: string;
  pronunciation: string;
  exampleSentence: string;
}

/**
 * Parse multi-line input into an array of ParsedTerm.
 * Blank lines are skipped. Whitespace is trimmed.
 */
export function parseTerms(input: string): ParsedTerm[] {
  if (!input.trim()) return [];

  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseSingleLine);
}

/**
 * Parse a single line into a ParsedTerm.
 * Tries separators in order: "|", " - ", ": ", ":"
 */
function parseSingleLine(line: string): ParsedTerm {
  if (line.includes("|")) {
    return buildParsedTerm(line.split("|"));
  }

  // Try " - " first (most explicit)
  if (line.includes(" - ")) {
    return buildParsedTerm(line.split(" - "));
  }

  // Try ": " (colon-space)
  const colonSpaceIdx = line.indexOf(": ");
  if (colonSpaceIdx !== -1) {
    return {
      vocabulary: cleanToken(line.substring(0, colonSpaceIdx)),
      meaning: cleanToken(line.substring(colonSpaceIdx + 2)),
      pronunciation: "",
      exampleSentence: "",
    };
  }

  // Try ":" alone
  const colonIdx = line.indexOf(":");
  if (colonIdx !== -1 && colonIdx < line.length - 1) {
    return {
      vocabulary: cleanToken(line.substring(0, colonIdx)),
      meaning: cleanToken(line.substring(colonIdx + 1)),
      pronunciation: "",
      exampleSentence: "",
    };
  }

  // No separator found — entire line is the vocabulary
  return {
    vocabulary: cleanToken(line),
    meaning: "",
    pronunciation: "",
    exampleSentence: "",
  };
}

function buildParsedTerm(parts: string[]): ParsedTerm {
  const [vocabulary = "", meaning = "", pronunciation = "", ...exampleParts] =
    parts;

  return {
    vocabulary: cleanToken(vocabulary),
    meaning: cleanToken(meaning),
    pronunciation: cleanToken(pronunciation),
    exampleSentence: cleanToken(exampleParts.join(" - ")),
  };
}

/**
 * Remove surrounding quotes/apostrophes and extra whitespace.
 */
function cleanToken(s: string): string {
  let result = s.trim();
  // Strip surrounding quotes: 'word', "word", 「word」, 『word』
  if (
    (result.startsWith("'") && result.endsWith("'")) ||
    (result.startsWith('"') && result.endsWith('"')) ||
    (result.startsWith("「") && result.endsWith("」")) ||
    (result.startsWith("『") && result.endsWith("』"))
  ) {
    result = result.slice(1, -1).trim();
  }
  return result;
}
