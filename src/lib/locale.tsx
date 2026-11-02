"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "de" | "en";

const STORAGE_KEY = "backpanel-lang";

type LocaleValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LocaleContext = createContext<LocaleValue>({
  lang: "de",
  setLang: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("de");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "de") setLangState(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, ready]);

  return (
    <LocaleContext.Provider value={{ lang, setLang: setLangState }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  const { lang } = useLocale();
  return (de: string, en: string) => (lang === "en" ? en : de);
}
