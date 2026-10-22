"use client";

import * as React from "react";
import { isTranslatableText, TRANSLATION_BATCH_MAX_CHARS, TRANSLATION_BATCH_MAX_ITEMS } from "@/lib/translation";

export type Language = "en" | "ur";
const STORAGE_KEY = "aftermediate:language";
const CACHE_KEY = "aftermediate:urdu-translations:v1";
const MAX_CACHED_TRANSLATIONS = 1_500;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  translating: boolean;
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);
type Candidate = { value: string; apply: (translation: string) => void };

function canTranslateNode(node: Text) {
  const parent = node.parentElement;
  if (!parent || parent.closest("[data-no-translate], script, style, noscript, svg, code, pre, textarea, [contenteditable='true'], .chat-page-shell")) return false;
  return isTranslatableText(node.nodeValue ?? "");
}

function candidatesFrom(root: Node, seen: WeakSet<Text>) {
  const candidates: Candidate[] = [];
  const textNodes: Text[] = [];
  if (root.nodeType === Node.TEXT_NODE) textNodes.push(root as Text);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let found = walker.nextNode() as Text | null;
  while (found) {
    textNodes.push(found);
    found = walker.nextNode() as Text | null;
  }
  for (const node of textNodes) {
    const textNode = node;
    if (!seen.has(textNode) && canTranslateNode(textNode)) {
      const original = textNode.nodeValue ?? "";
      candidates.push({
        value: original.trim(),
        apply: (translation) => { textNode.nodeValue = original.replace(original.trim(), translation); },
      });
      seen.add(textNode);
    }
  }
  return candidates;
}

function attributeCandidates(root: Element, seen: WeakSet<Element>) {
  const candidates: Candidate[] = [];
  const elements = [
    ...(root.matches("[placeholder], [aria-label], [title], img[alt]") ? [root as HTMLElement] : []),
    ...root.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title], img[alt]"),
  ];
  elements.forEach((element) => {
    if (seen.has(element) || element.closest("[data-no-translate], .chat-page-shell")) return;
    seen.add(element);
    (["placeholder", "aria-label", "title", "alt"] as const).forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value || !isTranslatableText(value)) return;
      candidates.push({ value, apply: (translation) => element.setAttribute(attribute, translation) });
    });
  });
  return candidates;
}

function batches(candidates: Candidate[]) {
  const all: Candidate[][] = [];
  let current: Candidate[] = [];
  let chars = 0;
  for (const candidate of candidates) {
    if (current.length === TRANSLATION_BATCH_MAX_ITEMS || chars + candidate.value.length > TRANSLATION_BATCH_MAX_CHARS) {
      if (current.length) all.push(current);
      current = [];
      chars = 0;
    }
    current.push(candidate);
    chars += candidate.value.length;
  }
  if (current.length) all.push(current);
  return all;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>("en");
  const [translating, setTranslating] = React.useState(false);
  const cache = React.useRef(new Map<string, string>());

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    try {
      const saved = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "{}") as Record<string, unknown>;
      Object.entries(saved).forEach(([source, translation]) => {
        if (typeof translation === "string") cache.current.set(source, translation);
      });
    } catch {
      // A corrupt cache simply gets rebuilt from fresh translations.
    }
    const timer = window.setTimeout(() => {
      if (stored === "ur") setLanguageState("ur");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setLanguage = React.useCallback((next: Language) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setLanguageState(next);
    if (next === "en") window.location.reload();
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = language === "ur" ? "ur" : "en";
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    document.documentElement.dataset.language = language;
  }, [language]);

  React.useEffect(() => {
    if (language !== "ur") return;
    let active = true;
    const seenText = new WeakSet<Text>();
    const seenAttributes = new WeakSet<Element>();
    const translate = async (root: Node) => {
      const element = root.nodeType === Node.ELEMENT_NODE ? root as Element : root.parentElement;
      const candidates = [
        ...candidatesFrom(root, seenText),
        ...(element ? attributeCandidates(element, seenAttributes) : []),
      ];
      for (const batch of batches(candidates)) {
        if (!active) return;
        const pending = [...new Set(batch.map((candidate) => candidate.value).filter((value) => !cache.current.has(value)))];
        if (pending.length) {
          setTranslating(true);
          try {
            const response = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ texts: pending }),
            });
            const json = await response.json() as { translations?: Record<string, string> };
            if (!response.ok || !json.translations) continue;
            pending.forEach((value, index) => {
              const translated = json.translations?.[String(index)];
              if (translated) cache.current.set(value, translated);
            });
            try {
              const saved = Object.fromEntries([...cache.current.entries()].slice(-MAX_CACHED_TRANSLATIONS));
              window.localStorage.setItem(CACHE_KEY, JSON.stringify(saved));
            } catch {
              // Local storage may be unavailable or full; the in-memory cache still works.
            }
          } catch {
            // English remains visible when a translation request fails.
          } finally {
            if (active) setTranslating(false);
          }
        }
        if (!active) return;
        batch.forEach((candidate) => {
          const translated = cache.current.get(candidate.value);
          if (translated) candidate.apply(translated);
        });
      }
    };
    const observer = new MutationObserver((records) => {
      const roots = new Set<Node>();
      records.forEach((record) => record.addedNodes.forEach((node) => roots.add(node)));
      roots.forEach((root) => { void translate(root); });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    void translate(document.body);
    return () => { active = false; observer.disconnect(); };
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage, translating }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
