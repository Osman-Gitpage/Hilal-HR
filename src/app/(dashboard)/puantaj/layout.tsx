"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutList, FolderKanban, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PUANTAJ_TABS = [
  {
    href: "/puantaj",
    etiket: "Genel Puantaj",
    ikon: LayoutList,
    id: "tab-genel-puantaj",
  },
  {
    href: "/puantaj/proje",
    etiket: "Proje Puantaj",
    ikon: FolderKanban,
    id: "tab-proje-puantaj",
  },
  {
    href: "/puantaj/projeler",
    etiket: "Projeler",
    ikon: Building2,
    id: "tab-projeler",
  },
];

export default function PuantajLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Puantaj</h1>
        <p className="text-muted-foreground mt-1">
          Personel devam takibi, proje bazlı çalışma saatleri ve proje yönetimi.
        </p>
      </div>

      {/* Sub-nav */}
      <div className="border-b">
        <nav className="flex gap-1 -mb-px">
          {PUANTAJ_TABS.map((tab) => {
            // Genel Puantaj: sadece tam eşleşme
            // Diğerleri: başlangıç eşleşmesi
            const aktif =
              tab.href === "/puantaj"
                ? pathname === "/puantaj"
                : pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Ikon = tab.ikon;

            return (
              <Link
                key={tab.href}
                id={tab.id}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  aktif
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                <Ikon className="h-4 w-4" />
                {tab.etiket}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* İçerik */}
      {children}
    </div>
  );
}
