"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cikisYap } from "@/app/actions/auth";
import { sirketAyarla } from "@/app/actions/sirket";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Building2, Menu, ChevronsUpDown, Check, Plus } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useSirketStore } from "@/stores/sirketStore";
import { useUIStore } from "@/stores/uiStore";
import type { Sirket } from "@/supabase/app-types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AppTopbarProps {
  user: SupabaseUser;
  sirketler: Array<{
    sirket_id: string;
    rol: string;
    sirketler: Sirket | Sirket[] | null;
  }>;
}

function ilkSirket(ks: AppTopbarProps["sirketler"][number]): Sirket | null {
  if (!ks.sirketler) return null;
  return Array.isArray(ks.sirketler) ? ks.sirketler[0] ?? null : ks.sirketler;
}

export function AppTopbar({ user, sirketler }: AppTopbarProps) {
  const { aktifSirketId, setAktifSirket } = useSirketStore();
  const { toggleMobileSidebar } = useUIStore();
  const [sirketDegisiyor, setSirketDegisiyor] = useState(false);
  const router = useRouter();

  // İlk yüklemede aktif şirketi store'a ve cookie'ye yaz
  useEffect(() => {
    if (sirketler.length === 0) return;
    const sirket = ilkSirket(sirketler[0]);
    if (!sirket) return;
    if (aktifSirketId === sirket.id) return;
    setAktifSirket(sirket);
    sirketAyarla(sirket.id);
  }, [sirketler, aktifSirketId, setAktifSirket]);

  const adSoyad = user.user_metadata?.ad_soyad ?? user.email ?? "Kullanıcı";
  const initials = adSoyad
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Aktif şirket adı
  const aktifSirketAd = (() => {
    if (sirketler.length === 0) return "Henüz şirket eklenmedi";
    const aktifKs =
      sirketler.find((k) => ilkSirket(k)?.id === aktifSirketId) ?? sirketler[0];
    return ilkSirket(aktifKs)?.ad ?? "Şirket";
  })();

  // Tüm şirket nesnelerini düzleştir
  const tumSirketler = sirketler
    .map((ks) => ({ ks, sirket: ilkSirket(ks) }))
    .filter((x): x is { ks: AppTopbarProps["sirketler"][number]; sirket: Sirket } => x.sirket !== null);

  const cokluSirket = tumSirketler.length > 1;

  async function handleSirketDegistir(sirket: Sirket) {
    if (sirket.id === aktifSirketId) return;
    setSirketDegisiyor(true);
    setAktifSirket(sirket);
    await sirketAyarla(sirket.id);
    setSirketDegisiyor(false);
    toast.success(`Şirket değiştirildi: ${sirket.ad}`, { duration: 3000 });
    // Sayfayı yenile — server component'ler yeni şirket ID'siyle çalışsın
    window.location.reload();
  }

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-zinc-950/95 backdrop-blur flex items-center justify-between px-4 sm:px-6 shrink-0 gap-3">
      {/* Sol: Hamburger + Şirket Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — sadece mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden shrink-0 h-9 w-9 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
          onClick={toggleMobileSidebar}
          id="btn-mobile-menu"
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Şirket — tek şirket: sade göster, çoklu: dropdown */}
        {cokluSirket ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              id="btn-sirket-sec"
              className="flex items-center gap-2 text-sm font-medium rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-0"
            >
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                {sirketDegisiyor ? "Değiştiriliyor..." : aktifSirketAd}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-0.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Şirketler</p>
              </div>
              {tumSirketler.map(({ sirket }) => (
                <DropdownMenuItem
                  key={sirket.id}
                  onClick={() => handleSirketDegistir(sirket)}
                  className="flex items-center gap-2 cursor-pointer"
                  id={`btn-sirket-${sirket.id}`}
                >
                  <div className="w-4 shrink-0">
                    {sirket.id === aktifSirketId && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <span className="truncate">{sirket.ad}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                id="btn-yeni-sirket"
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push("/onboarding")}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                Yeni Şirket Ekle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="font-medium text-foreground truncate max-w-[140px] sm:max-w-none">
              {aktifSirketAd}
            </span>
          </div>
        )}
      </div>

      {/* Sağ: Kullanıcı menüsü */}
      <DropdownMenu>
        <DropdownMenuTrigger
          id="btn-kullanici-menu"
          className="flex items-center gap-2 px-2 h-9 rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:block">{adSoyad}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-sm font-semibold leading-none truncate">{adSoyad}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            id="menu-profil"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/profil")}
          >
            <User className="h-4 w-4" />
            Profil & Hesap
          </DropdownMenuItem>
          {!cokluSirket && (
            <DropdownMenuItem
              id="menu-yeni-sirket"
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/onboarding")}
            >
              <Plus className="h-4 w-4" />
              Yeni Şirket Ekle
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            id="menu-cikis"
            className="text-red-600 focus:text-red-600 cursor-pointer"
            onClick={() => {
              toast.loading("Çıkış yapılıyor...", { id: "cikis" });
              cikisYap();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
