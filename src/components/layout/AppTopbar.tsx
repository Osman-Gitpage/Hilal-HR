"use client";

import { useEffect } from "react";
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
import { LogOut, User, Building2 } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useSirketStore } from "@/stores/sirketStore";
import type { Sirket } from "@/supabase/app-types";

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

  // İlk yüklemede (veya şirket listesi değiştiğinde) aktif şirketi store'a ve cookie'ye yaz
  useEffect(() => {
    if (sirketler.length === 0) return;
    const sirket = ilkSirket(sirketler[0]);
    if (!sirket) return;
    if (aktifSirketId === sirket.id) return;
    setAktifSirket(sirket);
    // T2.1: Cookie'yi de güncelle — server actions doğru şirketi okusun
    sirketAyarla(sirket.id);
  }, [sirketler, aktifSirketId, setAktifSirket]);

  const adSoyad =
    user.user_metadata?.ad_soyad ?? user.email ?? "Kullanıcı";
  const initials = adSoyad
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Topbar'da gösterilecek aktif şirket adı
  const aktifSirketAd = (() => {
    if (sirketler.length === 0) return "Henüz şirket eklenmedi";
    const aktifKs =
      sirketler.find((k) => ilkSirket(k)?.id === aktifSirketId) ??
      sirketler[0];
    return ilkSirket(aktifKs)?.ad ?? "Şirket";
  })();

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur flex items-center justify-between px-6 shrink-0">
      {/* Sol: Aktif şirket adı */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span className="font-medium text-foreground">{aktifSirketAd}</span>
      </div>

      {/* Sağ: Kullanıcı menüsü */}
      <DropdownMenu>
        <DropdownMenuTrigger
          id="btn-kullanici-menu"
          className="flex items-center gap-2 px-2 h-9 rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:block">{adSoyad}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-1.5 py-1">
            <p className="text-sm font-medium leading-none">{adSoyad}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem id="menu-profil">
            <User className="mr-2 h-4 w-4" />
            Profil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            id="menu-cikis"
            className="text-red-600 focus:text-red-600"
            onClick={() => cikisYap()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
