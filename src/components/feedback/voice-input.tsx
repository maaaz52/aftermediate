"use client";

import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return (Ctor as (new () => SpeechRecognitionLike) | undefined) ?? null;
}

export function VoiceInput({ onResult, disabled }: { onResult: (text: string) => void; disabled?: boolean }) {
  const [supported] = useState(() => getSpeechRecognition() !== null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => recRef.current?.stop();
  }, []);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    const rec = new Ctor();
    recRef.current = rec;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      if (text.trim()) onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        listening
          ? "border-emerald/40 bg-emerald/10 text-emerald"
          : "border-line text-muted hover:border-saffron/40 hover:text-ink"
      } disabled:opacity-40`}
    >
      <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} aria-hidden />
      {listening ? "Listening… tap to stop" : "Speak your story"}
    </button>
  );
}
