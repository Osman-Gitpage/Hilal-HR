"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Users,
  DollarSign,
  ClipboardList,
  Receipt,
  FileText,
  BarChart3,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";

interface NavItem {
  href: string;
  etiket: string;
  ikon: React.ForwardRefExoticComponent<
    Omit<import("lucide-react").LucideProps, "ref"> &
    React.RefAttributes<SVGSVGElement>
  >;
  id: string;
  yakinsa?: boolean;
}
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_GROUPS: { baslik: string; items: NavItem[] }[] = [
  {
    baslik: "Ana Menü",
    items: [
      {
        href: "/dashboard",
        etiket: "Dashboard",
        ikon: LayoutDashboard,
        id: "nav-dashboard",
      },
    ],
  },
  {
    baslik: "İşlemler",
    items: [
      {
        href: "/personel",
        etiket: "Personel",
        ikon: Users,
        id: "nav-personel",
      },
      {
        href: "/bordro",
        etiket: "Bordro",
        ikon: DollarSign,
        id: "nav-bordro",
      },
      {
        href: "/puantaj",
        etiket: "Puantaj",
        ikon: ClipboardList,
        id: "nav-puantaj",
      },
      {
        href: "/cari",
        etiket: "Cari",
        ikon: Receipt,
        id: "nav-cari",
      },
      {
        href: "/evrak",
        etiket: "Evrak",
        ikon: FileText,
        id: "nav-evrak",
      },
      {
        href: "/garaj",
        etiket: "Garaj",
        ikon: Car,
        id: "nav-garaj",
      },
    ],
  },
  {
    baslik: "Raporlama",
    items: [
      {
        href: "/raporlar",
        etiket: "Raporlar",
        ikon: BarChart3,
        id: "nav-raporlar",
        yakinsa: true,
      },
    ],
  },
  {
    baslik: "Sistem",
    items: [
      {
        href: "/ayarlar",
        etiket: "Ayarlar",
        ikon: Settings,
        id: "nav-ayarlar",
      },
    ],
  },
];

// Tüm nav itemları düz liste olarak — collapsed tooltip için
const NAV_ITEMS_FLAT = NAV_GROUPS.flatMap((g) => g.items);

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarAcik, toggleSidebar, mobileSidebarAcik, setMobileSidebarAcik } =
    useUIStore();

  function handleNavClick() {
    if (mobileSidebarAcik) setMobileSidebarAcik(false);
  }

  function SidebarIcerik({ mobile = false }: { mobile?: boolean }) {
    const acik = mobile ? true : sidebarAcik;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
        {/* ── Logo / Marka Başlığı ── */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center h-16 shrink-0 border-b border-zinc-100 dark:border-zinc-900 group transition-opacity hover:opacity-90 overflow-hidden",
            acik ? "px-4 gap-3" : "justify-center px-0"
          )}
        >
          <Image
            src="/test/fav.png"
            alt="Hilal Office Logo"
            width={32}
            height={32}
            className="h-8 w-8 object-contain shrink-0"
            priority
          />
          {acik && (
            <div className="flex flex-col min-w-0 truncate">
              <span className="font-bold text-zinc-900 dark:text-white text-sm leading-tight tracking-tight truncate">
                Hilal Office
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5 tracking-wide truncate">
                Bordro & Muhasebe
              </span>
            </div>
          )}
        </Link>

        {/* ── Navigasyon ── */}
        <nav className="flex-1 overflow-y-auto py-4">
          {acik ? (
            /* Geniş mod: gruplu bölümler */
            <div className="space-y-5 px-3">
              {NAV_GROUPS.map((grup) => (
                <div key={grup.baslik}>
                  {/* Bölüm başlığı */}
                  <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 px-2 truncate">
                    {grup.baslik}
                  </p>

                  {/* Bölüm linkleri */}
                  <div className="space-y-0.5">
                    {grup.items.map((item) => {
                      const aktif =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/");
                      const Ikon = item.ikon;

                      return (
                        <Link
                          key={item.id}
                          id={item.id}
                          href={item.yakinsa ? "#" : item.href}
                          onClick={handleNavClick}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                            aktif
                              ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white"
                              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-800 dark:hover:text-zinc-200",
                            item.yakinsa && "opacity-40 cursor-not-allowed pointer-events-none"
                          )}
                          aria-current={aktif ? "page" : undefined}
                        >
                          <Ikon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              aktif
                                ? "text-zinc-800 dark:text-white"
                                : "text-zinc-400 dark:text-zinc-500"
                            )}
                          />
                          <span className="truncate">{item.etiket}</span>
                          {item.yakinsa && (
                            <span className="ml-auto text-[9px] bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded px-1 py-0.5 font-semibold tracking-wide">
                              Yakında
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Dar mod: sadece ikonlar + tooltip */
            <div className="flex flex-col items-center gap-1 px-1">
              {NAV_ITEMS_FLAT.map((item) => {
                const aktif =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Ikon = item.ikon;

                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger
                      render={(props) => (
                        <Link
                          {...props}
                          id={item.id}
                          href={item.yakinsa ? "#" : item.href}
                          onClick={handleNavClick}
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-150",
                            aktif
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                              : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-700 dark:hover:text-zinc-300",
                            item.yakinsa && "opacity-40 cursor-not-allowed pointer-events-none"
                          )}
                          aria-current={aktif ? "page" : undefined}
                        >
                          <Ikon className="h-4.5 w-4.5 shrink-0" />
                        </Link>
                      )}
                    />
                    <TooltipContent side="right" className="text-xs">
                      {item.etiket}
                      {item.yakinsa && " (Yakında)"}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </nav>

        {/* ── Toggle Butonu — Sadece Desktop ── */}
        {!mobile && (
          <div className="border-t border-zinc-100 dark:border-zinc-900 p-3 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={cn(
                "w-full h-8 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors duration-150"
              )}
              id="btn-sidebar-toggle"
              aria-label={sidebarAcik ? "Sidebar'ı kapat" : "Sidebar'ı aç"}
            >
              {sidebarAcik ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ── DESKTOP Sidebar ── */}
      <aside
        className={cn(
          "hidden sm:flex flex-col h-full border-r border-zinc-100 dark:border-zinc-900 transition-all duration-200 ease-in-out shrink-0",
          sidebarAcik ? "w-56" : "w-16"
        )}
      >
        <SidebarIcerik />
      </aside>

      {/* ── MOBİL Backdrop ── */}
      {
        mobileSidebarAcik && (
          <div
            className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 sm:hidden backdrop-blur-sm"
            onClick={() => setMobileSidebarAcik(false)}
            aria-hidden="true"
          />
        )
      }

      {/* ── MOBİL Drawer ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 transition-transform duration-300 ease-in-out sm:hidden shadow-xl",
          mobileSidebarAcik ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobil navigasyon"
      >
        <SidebarIcerik mobile />
      </aside>
    </>
  );
}
