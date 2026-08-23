export type AudioRecorderHandle = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

function chooseMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";
}

export async function startAudioRecorder(): Promise<AudioRecorderHandle> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone recording is not supported in this app environment.");
  }
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Audio recording is not supported in this app environment.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = chooseMimeType();
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  let stopped = false;

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const stop = () => new Promise<Blob>((resolve, reject) => {
    if (stopped) {
      reject(new Error("This microphone recording has already been stopped."));
      return;
    }
    stopped = true;
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
      if (!blob.size) reject(new Error("No audio was captured. Speak clearly and try again."));
      else resolve(blob);
    };
    recorder.onerror = () => {
      stream.getTracks().forEach((track) => track.stop());
      reject(new Error("The microphone recording failed. Check permission and try again."));
    };
    recorder.stop();
  });

  const cancel = () => {
    if (stopped) return;
    stopped = true;
    recorder.ondataavailable = null;
    recorder.onstop = null;
    recorder.onerror = null;
    if (recorder.state !== "inactive") recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
  };

  recorder.start();
  return { stop, cancel };
}

export async function audioBlobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export function describeAudioCaptureError(error: unknown): string {
  const message = error instanceof Error ? error.message : "The microphone could not start.";
  if (/denied|permission|not allowed/i.test(message)) return "Microphone access was denied. Allow microphone access in Android settings, then try again.";
  return message;
}
