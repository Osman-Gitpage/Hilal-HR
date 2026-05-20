"use client";

/**
 * T5.1: Bordro layout — kilitlendi badge sayacı eklendi.
 * Seçili dönem için kilitlenmiş bordro sayısını gösterir.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutList, FilePenLine, Landmark, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useDonemBordrolari } from "@/hooks/useMaasBordro";

const BORDRO_TABS = [
  { href: "/bordro",            etiket: "Maaş Listesi", ikon: LayoutList, id: "tab-maas-listesi" },
  { href: "/bordro/veri-girisi", etiket: "Veri Girişi",  ikon: FilePenLine, id: "tab-veri-girisi" },
  { href: "/bordro/banka",      etiket: "Banka Ödeme",  ikon: Landmark,    id: "tab-banka-odeme" },
];

// ── Kilitli bordro sayacı ──────────────────────────────────────
function KilitBadge() {
  const { seciliDonemYil, seciliDonemAy } = useUIStore();
  const { data: liste = [] } = useDonemBordrolari(seciliDonemYil, seciliDonemAy);
  const kilitSayisi = liste.filter((b) => b.durum === "kilitlendi").length;

  if (kilitSayisi === 0) return null;
  return (
    <span
      title={`${kilitSayisi} kilitli bordro`}
      className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400"
    >
      <Lock className="h-2.5 w-2.5" />
      {kilitSayisi}
    </span>
  );
}

// ── Layout ────────────────────────────────────────────────────
export default function BordroLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Detay sayfası ([bordroId]) — sub-nav gösterme
  // Bilinen path'ler hariç: /bordro, /bordro/veri-girisi, /bordro/banka
  const BILINEN_YOLLAR = ["/bordro", "/bordro/veri-girisi", "/bordro/banka"];
  const isDetay = !BILINEN_YOLLAR.includes(pathname) && pathname.startsWith("/bordro/");

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maaş Bordro</h1>
        <p className="text-muted-foreground mt-1">
          Aylık bordro girişi, hesaplama ve banka ödemeleri.
        </p>
      </div>

      {/* Sub-nav — detay sayfasında gizle */}
      {!isDetay && (
        <div className="border-b">
          <nav className="flex gap-1 -mb-px">
            {BORDRO_TABS.map((tab) => {
              const aktif = pathname === tab.href;
              const Ikon = tab.ikon;
              return (
                <Link
                  key={tab.href}
                  id={tab.id}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                    aktif
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  )}
                >
                  <Ikon className="h-4 w-4" />
                  {tab.etiket}
                  {/* T5.1: Maaş Listesi tab'ında kilitli badge */}
                  {tab.href === "/bordro" && <KilitBadge />}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* İçerik */}
      {children}
    </div>
  );
}
