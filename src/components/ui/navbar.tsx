"use client";

import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../common/LanguageSwitcher";
import i18n from "@/i18n";

export default function Navbar() {
    const { t } = useTranslation();
    console.log(i18n.language)
  
    return (
    <nav className="flex items-center justify-between px-6 py-4 border-b">
      <div className="flex gap-6">
        <span>{t("common.home")}</span>
        <span>{t("common.course")}</span>
        <span>{t("common.flashcard")}</span>
      </div>

      <LanguageSwitcher />
    </nav>
  );
}
