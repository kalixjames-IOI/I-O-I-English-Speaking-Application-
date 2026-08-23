import { isSupabaseConfigured, supabase } from "./supabase";

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const session = isSupabaseConfigured ? await supabase.auth.getSession() : { data: { session: null } };
  const headers = new Headers(init.headers);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (session.data.session?.access_token) {
    headers.set("Authorization", `Bearer ${session.data.session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}
