/**
 * i18n Helper Utilities
 * 
 * Cung cấp các hàm helper để lazy load namespaces theo route
 */
import i18n from "i18next";
import { NAMESPACE_GROUPS, NamespaceGroup } from "@/i18n";

/**
 * Preload namespaces cho một route group cụ thể
 * Gọi trong useEffect hoặc trước khi navigate
 */
export async function preloadNamespaceGroup(group: NamespaceGroup): Promise<void> {
  const namespaces = NAMESPACE_GROUPS[group];
  if (!namespaces) {
    console.warn(`Unknown namespace group: ${group}`);
    return;
  }

  // i18next sẽ cache namespaces sau lần đầu load
  // Function này chỉ để đảm bảo namespaces được init trước
  const resources = i18n.store.data as Record<string, { translation?: Record<string, unknown> }>;

  for (const ns of namespaces) {
    if (!resources[i18n.language]?.translation?.[ns]) {
      // Namespace chưa load - đợi i18next tự load
      await new Promise<void>((resolve) => {
        const checkLoaded = () => {
          if (resources[i18n.language]?.translation?.[ns]) {
            resolve();
          } else {
            setTimeout(checkLoaded, 50);
          }
        };
        checkLoaded();
      });
    }
  }
}

/**
 * Get current loaded namespaces
 */
export function getLoadedNamespaces(): string[] {
  const data = i18n.store.data;
  const lang = i18n.language;
  return Object.keys(data[lang]?.translation || {});
}

/**
 * Check if a key exists in any loaded namespace
 */
export function keyExists(key: string): boolean {
  return i18n.exists(key);
}

/**
 * Get all namespaces for a group as dotted keys
 * Ví dụ: ["common.home", "common.course", "auth.login"]
 */
export function getNamespacedKeys(group: NamespaceGroup): string[] {
  const namespaces = NAMESPACE_GROUPS[group];
  const keys: string[] = [];
  
  for (const ns of namespaces) {
    keys.push(ns); // Top-level namespace
  }
  
  return keys;
}

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = ["vi", "en", "ja"] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Get language display name
 */
export function getLanguageDisplayName(code: SupportedLanguage): string {
  const names: Record<SupportedLanguage, string> = {
    vi: "Tiếng Việt",
    en: "English",
    ja: "日本語",
  };
  return names[code] || code;
}

/**
 * Get language flag emoji
 */
export function getLanguageFlag(code: SupportedLanguage): string {
  const flags: Record<SupportedLanguage, string> = {
    vi: "🇻🇳",
    en: "🇬🇧",
    ja: "🇯🇵",
  };
  return flags[code] || "🌐";
}
