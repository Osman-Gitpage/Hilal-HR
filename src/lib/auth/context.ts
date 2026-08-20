// ─── Centralized Auth Context ─────────────────────────────────────────────────
// THE ONLY place where authentication and company context is resolved.
// Every server action MUST use this instead of its own copy.
//
// Previously, getAuthContext() was copy-pasted in 7+ action files.
// This eliminates duplication and ensures consistent auth behavior.

import { createClient } from "@/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ─── Return Types ─────────────────────────────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface AuthContext {
  supabase: SupabaseClient;
  user: { id: string; email?: string };
  sirketId: string;
  rol: string;
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Resolves the authenticated user and their active company context.
 *
 * - Verifies Supabase session
 * - Loads active company ID from cookie 'aktif_sirket_id' if available, falling back to first company
 * - Redirects to `/giris` if not authenticated
 * - Throws if no company is associated
 *
 * @returns AuthContext with supabase client, user, sirketId, and rol
 */
export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  const cookieStore = await cookies();
  const cookieSirketId = cookieStore.get("aktif_sirket_id")?.value;

  const { data: sirketler, error: ksError } = await supabase
    .from("kullanici_sirket")
    .select("sirket_id, rol")
    .eq("kullanici_id", user.id);

  if (ksError) {
    throw new Error(`Şirket sorgusu başarısız: ${ksError.message}`);
  }
  if (!sirketler || sirketler.length === 0) {
    throw new Error("Bu kullanıcıya ait şirket kaydı bulunamadı.");
  }

  const match = cookieSirketId
    ? sirketler.find((s) => s.sirket_id === cookieSirketId)
    : undefined;
  const ks = match ?? sirketler[0];

  return {
    supabase,
    user,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sirketId: (ks as any).sirket_id as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rol: (ks as any).rol as string,
  };
}

// ─── Convenience: Just Company ID ─────────────────────────────────────────────

/**
 * Returns only the sirketId for lightweight operations.
 * Same auth checks as getAuthContext but discards the rest.
 * Used by cari.ts and other modules that only need the company ID.
 */
export async function getSirketId(): Promise<string> {
  const { sirketId } = await getAuthContext();
  return sirketId;
}

// ─── Convenience: Require Admin ───────────────────────────────────────────────

/**
 * Same as getAuthContext but throws if the user role is not "admin".
 * Used for admin-only operations (settings, dangerous deletes, etc.)
 */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (ctx.rol !== "admin") {
    throw new Error("Bu işlem için yönetici yetkisi gereklidir.");
  }
  return ctx;
}
