"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [isMounted, setIsMounted] = useState(false);
    const [lang, setLang] = useState(i18n.language);

    useEffect(() => {
        const storedLang = localStorage.getItem("i18nextLng");
        if (storedLang && storedLang !== i18n.language) {
            i18n.changeLanguage(storedLang);
        }

        setIsMounted(true);

        const handleLanguageChange = (l: string) => {
            localStorage.setItem("i18nextLng", l);
            setLang(l);
        };

        i18n.on("languageChanged", handleLanguageChange);
        return () => {
            i18n.off("languageChanged", handleLanguageChange);
        };
    }, []);

    // suppressHydrationWarning cho phép i18n text thay đổi sau mount
    // mà không throw hydration error (React sẽ bỏ qua diff này)
    return (
        <I18nextProvider i18n={i18n} key={lang}>
            <div suppressHydrationWarning style={{ visibility: isMounted ? "visible" : "hidden" }} className="contents">
                {children}
            </div>
        </I18nextProvider>
    );
}
