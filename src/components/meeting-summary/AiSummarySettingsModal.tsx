"use client";

import { useState } from "react";
import { X, Sparkles, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface AiSummarySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabled: boolean;
  language: string;
  onToggle: (enabled: boolean) => void;
  onLanguageChange: (language: string) => void;
  isLoading?: boolean;
}

export function AiSummarySettingsModal({
  isOpen,
  onClose,
  enabled,
  language,
  onToggle,
  onLanguageChange,
  isLoading = false,
}: AiSummarySettingsModalProps) {
  const { t } = useTranslation();
  const [localEnabled, setLocalEnabled] = useState(enabled);
  const [localLanguage, setLocalLanguage] = useState(language);

  if (!isOpen) return null;

  const handleSave = () => {
    if (localEnabled !== enabled) {
      onToggle(localEnabled);
    }
    if (localLanguage !== language) {
      onLanguageChange(localLanguage);
    }
    onClose();
  };

  const languages = [
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
    { code: "ja", label: "Tiếng Nhật", flag: "🇯🇵" },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1d27] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-[#F0F0F0] font-semibold text-lg">
                {t("meetingSummary.settings.title", "AI Summary Settings")}
              </h2>
              <p className="text-[#8B8FA8] text-xs">
                {t("meetingSummary.settings.subtitle", "Configure your meeting summary preferences")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#8B8FA8] hover:text-[#F0F0F0]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-[#F0F0F0] font-medium">
                  {t("meetingSummary.settings.enable", "Enable AI Summary")}
                </p>
                <p className="text-[#8B8FA8] text-xs">
                  {t("meetingSummary.settings.enableDesc", "Automatically generate summary after meetings")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLocalEnabled(!localEnabled)}
              disabled={isLoading}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                localEnabled ? "bg-secondary" : "bg-[#3a3f4a]"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                  localEnabled ? "translate-x-7" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[#F0F0F0] font-medium">
                  {t("meetingSummary.settings.language", "Summary Language")}
                </p>
                <p className="text-[#8B8FA8] text-xs">
                  {t("meetingSummary.settings.languageDesc", "Language for AI-generated summary")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLocalLanguage(lang.code)}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border transition-all",
                    localLanguage === lang.code
                      ? "border-secondary bg-secondary/10"
                      : "border-white/10 bg-[#0f1117] hover:border-white/20"
                  )}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    localLanguage === lang.code ? "text-[#F0F0F0]" : "text-[#8B8FA8]"
                  )}>
                    {lang.label}
                  </span>
                  {localLanguage === lang.code && (
                    <Check className="h-4 w-4 text-secondary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-300 text-xs leading-relaxed">
              {t(
                "meetingSummary.settings.info",
                "AI Summary uses speech-to-text to transcribe your meetings and generates a summary using AI. Both participants can view the summary after the meeting."
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#0f1117]/50">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-[#8B8FA8] hover:text-[#F0F0F0]"
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-secondary hover:bg-secondary/90"
          >
            {isLoading ? t("common.loading", "Loading...") : t("common.save", "Save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
