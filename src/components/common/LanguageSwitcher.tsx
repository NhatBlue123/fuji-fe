"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe2, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

type LangCode = "vi" | "en" | "ja";

const LANGUAGES: Array<{
  code: LangCode;
  nativeName: string;
  description: string;
}> = [
    { code: "vi", nativeName: "Vietnam", description: "Tiếng Việt" },
    { code: "en", nativeName: "English", description: "English" },
    { code: "ja", nativeName: "Japan", description: "日本語" },
  ];

/**
 * LanguageSwitcher - Tinh chỉnh cuối:
 * - Đồng bộ Font-size tiêu đề (text-xs) với Notification Popover.
 * - Đồng bộ phong cách Input và List.
 * - Khớp kích thước h-10 w-10 của Trigger.
 */
export default function LanguageSwitcher({
  className,
  hideLabel = false,
}: {
  className?: string;
  hideLabel?: boolean;
}) {
  const { changeLanguage, currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filteredLanguages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (lang) =>
        lang.nativeName.toLowerCase().includes(q) ||
        lang.description.toLowerCase().includes(q),
    );
  }, [query]);

  const current =
    LANGUAGES.find((lang) => lang.code === currentLanguage) ?? LANGUAGES[0];

  const handleSelect = (code: LangCode) => {
    if (code === currentLanguage) return;
    changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-full border-none bg-transparent text-xs font-bold text-muted-foreground transition-all hover:text-secondary group active:scale-90 active:translate-y-[1px]",
            hideLabel ? "w-10 p-0" : "w-auto px-4",
            className,
          )}
        >
          <Globe2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
          {!hideLabel && <span className="truncate max-w-[80px] uppercase tracking-widest">{current.nativeName}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px] rounded-2xl border border-secondary/10 bg-popover text-popover-foreground shadow-2xl p-0 overflow-hidden backdrop-blur-md" align="end">
        {/* Header - Đồng bộ với Notification */}
        <div className="flex items-center gap-2 border-b border-secondary/20 px-5 py-4 bg-secondary/5">
             <Globe2 className="size-4 text-secondary" />
             <div className="text-xs font-bold uppercase tracking-widest text-secondary font-sans">
                {t("languageSwitcher.title") || "Cài đặt ngôn ngữ"}
             </div>
        </div>
        
        <div className="p-4 space-y-4">
            {/* Search input */}
            <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground/60">
                <Search className="h-4 w-4" />
            </span>
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("languageSwitcher.searchPlaceholder") || "Tìm kiếm ngôn ngữ..."}
                className="pl-9 bg-muted/30 border-none rounded-xl focus-visible:ring-secondary/30 h-10 text-xs font-medium"
            />
            </div>

            {/* Language list */}
            <ScrollArea className="max-h-64 rounded-xl border border-border bg-muted/10 overflow-hidden">
            <div className="flex flex-col">
                {filteredLanguages.map((lang) => {
                const isActive = lang.code === currentLanguage;
                return (
                    <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelect(lang.code)}
                        className={cn(
                            "flex w-full items-center justify-between px-4 py-3.5 text-left transition-all border-b border-border/10 last:border-none relative group",
                            isActive
                            ? "bg-secondary/10 font-bold text-secondary"
                            : "hover:bg-secondary/[0.03] text-foreground/70 hover:text-secondary",
                        )}
                    >
                        <div className="flex flex-col">
                            <span className="text-[13px] font-bold leading-none mb-1.5">{lang.nativeName}</span>
                            <span className="text-[10px] font-bold uppercase opacity-40 tracking-wider">
                            {lang.description}
                            </span>
                        </div>
                        {isActive && (
                            <div className="size-6 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg shadow-secondary/20 scale-100 animate-in zoom-in-50">
                            <Check className="h-3.5 w-3.5 stroke-[3.5px]" />
                            </div>
                        )}
                    </button>
                );
                })}
                {filteredLanguages.length === 0 && (
                <p className="px-3 py-6 text-xs text-muted-foreground text-center opacity-50">
                    {t("languageSwitcher.noResults") || "Không tìm thấy kết quả"}
                </p>
                )}
            </div>
            </ScrollArea>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
