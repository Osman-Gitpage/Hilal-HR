import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  // Kullanıcının erişebildiği şirketleri çek (tam şirket bilgisiyle)
  const { data: sirketler } = await supabase
    .from("kullanici_sirket")
    .select("sirket_id, rol, sirketler(id, ad, vergi_no, adres, telefon, email, logo_url, created_at, updated_at)")
    .eq("kullanici_id", user.id);

  // Şirket kaydı yoksa onboarding'e yönlendir
  if (!sirketler || sirketler.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      {/* flex-1 → desktop'ta kalan alanı doldurur; mobile'da sidebar fixed olduğundan tam genişlik alır */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppTopbar user={user} sirketler={sirketler ?? []} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

