"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState(i18n.language);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        const storedLang = localStorage.getItem("i18nextLng");
        if (storedLang && storedLang !== i18n.language) {
            i18n.changeLanguage(storedLang);
        }

        const handleLanguageChange = (l: string) => {
            setLang(l);
            localStorage.setItem("i18nextLng", l);
        };

        i18n.on("languageChanged", handleLanguageChange);
        return () => {
            i18n.off("languageChanged", handleLanguageChange);
        };
    }, []);

    // Không render children trước khi mounted nếu không muốn chớp chữ,
    // nhưng để tránh hydration error hoàn toàn và tốt cho SEO, ta render với default language ('vi') 
    // trên server + client first pass. Lúc đó DOM tree khớp 100%.

    return (
        <I18nextProvider i18n={i18n} key={lang}>
            <div suppressHydrationWarning style={{ visibility: isMounted ? "visible" : "hidden" }} className="contents">
                {children}
            </div>
        </I18nextProvider>
    );
}
