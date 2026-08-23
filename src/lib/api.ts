import { isSupabaseConfigured, supabase } from "./supabase";

const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function resolveApiInput(input: RequestInfo | URL): RequestInfo | URL {
  if (!apiBaseUrl || typeof input !== "string" || !input.startsWith("/")) return input;
  return `${apiBaseUrl}${input}`;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const session = isSupabaseConfigured ? await supabase.auth.getSession() : { data: { session: null } };
  const headers = new Headers(init.headers);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (session.data.session?.access_token) {
    headers.set("Authorization", `Bearer ${session.data.session.access_token}`);
  }
  return fetch(resolveApiInput(input), { ...init, headers });
}
