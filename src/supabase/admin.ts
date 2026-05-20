import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Servis rolü istemcisi — RLS'yi atlar.
 * SADECE sunucu tarafı güvenilir işlemler için kullanın.
 * Client Component veya tarayıcıya ifşa etmeyin.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik."
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
