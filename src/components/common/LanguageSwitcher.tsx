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

export default function LanguageSwitcher({
  className,
}: {
  className?: string;
}) {
  const { changeLanguage, currentLanguage } = useLanguage();
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
            "inline-flex h-8 w-28 items-center justify-center gap-2 rounded-full border border-border bg-background/60 px-3 text-xs font-medium text-muted-foreground shadow-sm hover:bg-background hover:text-foreground transition-colors whitespace-nowrap"
            ,
            className,
          )}
        >
          <Globe2 className="h-5 w-5" />
          <span className="truncate max-w-[80px]">{current.nativeName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-2xl border border-border bg-white text-slate-900 shadow-2xl p-4 space-y-4">
        <div className="text-base font-semibold">Cài đặt ngôn ngữ</div>
        {/* Search input */}
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm ngôn ngữ..."
            className="pl-9 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Language list */}
        <ScrollArea className="max-h-64 rounded-xl border border-slate-200 bg-slate-50">
          <div className="py-1">
            {filteredLanguages.map((lang) => {
              const isActive = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                    isActive
                      ? "bg-slate-200 font-semibold text-slate-900"
                      : "hover:bg-slate-100 text-slate-700",
                  )}
                >
                  <div className="flex flex-col">
                    <span>{lang.nativeName}</span>
                    <span className="text-xs text-slate-500">
                      {lang.description}
                    </span>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-emerald-600" />}
                </button>
              );
            })}
            {filteredLanguages.length === 0 && (
              <p className="px-3 py-4 text-xs text-slate-400">
                Không tìm thấy ngôn ngữ phù hợp
              </p>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
