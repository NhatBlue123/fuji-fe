"use client";

import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../common/LanguageSwitcher";

export default function Navbar() {
    const { t } = useTranslation();
  
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
