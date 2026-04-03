"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const storedLang = localStorage.getItem("i18nextLng");
        if (storedLang && storedLang !== i18n.language) {
            i18n.changeLanguage(storedLang);
        }

        const handleLanguageChange = (l: string) => {
            localStorage.setItem("i18nextLng", l);
        };

        i18n.on("languageChanged", handleLanguageChange);
        return () => {
            i18n.off("languageChanged", handleLanguageChange);
        };
    }, []);

    // suppressHydrationWarning cho phép i18n text thay đổi sau mount
    // mà không throw hydration error (React sẽ bỏ qua diff này)
    return (
        <I18nextProvider i18n={i18n}>
            <div suppressHydrationWarning className="contents">
                {children}
            </div>
        </I18nextProvider>
    );
}
