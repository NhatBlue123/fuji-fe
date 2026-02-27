"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState(i18n.language);

    useEffect(() => {
        const handleLanguageChange = (l: string) => {
            setLang(l);
        };

        i18n.on("languageChanged", handleLanguageChange);
        return () => {
            i18n.off("languageChanged", handleLanguageChange);
        };
    }, []);

    return (
        <I18nextProvider i18n={i18n} key={lang}>
            {children}
        </I18nextProvider>
    );
}

