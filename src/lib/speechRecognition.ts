export type SpeechRecognitionErrorCode = "unsupported" | "permission-denied" | "no-speech" | "network" | "aborted" | "unknown";

export type SpeechRecognitionError = {
  code: SpeechRecognitionErrorCode;
  message: string;
};

type RecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => RecognitionInstance;

export function getSpeechRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const browserWindow = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
}

export function describeSpeechRecognitionError(event: any): SpeechRecognitionError {
  const rawCode = String(event?.error || "unknown");
  const code = rawCode as SpeechRecognitionErrorCode;
  const messages: Record<SpeechRecognitionErrorCode, string> = {
    unsupported: "Speech recognition is not supported in this browser. You can type your message instead.",
    "permission-denied": "Microphone access was denied. Allow microphone access in your browser settings, then try again.",
    "no-speech": "No speech was detected. Speak clearly after starting the microphone and try again.",
    network: "The browser speech service is unavailable. Check your connection or type your message instead.",
    aborted: "Microphone listening was stopped before a transcript was captured.",
    unknown: "The microphone could not produce a transcript. Please try again or type your message.",
  };
  const normalized: SpeechRecognitionErrorCode = rawCode === "not-allowed" || rawCode === "service-not-allowed" ? "permission-denied" : code;
  return { code: normalized in messages ? normalized : "unknown", message: messages[normalized in messages ? normalized : "unknown"] };
}

export function normalizeTranscript(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
