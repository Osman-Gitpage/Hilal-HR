import type { Metadata } from "next";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { ProfilView } from "@/components/modules/profil/ProfilView";

export const metadata: Metadata = { title: "Profil & Hesap" };

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const adSoyad = user.user_metadata?.ad_soyad ?? "";
  const email = user.email ?? "";

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil & Hesap</h1>
        <p className="text-sm text-muted-foreground mt-1">Kişisel bilgilerinizi ve hesap ayarlarınızı yönetin.</p>
      </div>
      <div className="border border-border rounded-2xl px-6 divide-y divide-border">
        <ProfilView email={email} adSoyad={adSoyad} />
      </div>
    </div>
  );
}
