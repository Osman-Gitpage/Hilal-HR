"use client";

import Link from "next/link";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    etiket: "Dashboard",
    ikon: LayoutDashboard,
    id: "nav-dashboard",
  },
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
    href: "/raporlar",
    etiket: "Raporlar",
    ikon: BarChart3,
    id: "nav-raporlar",
    yakinsa: true,
  },
  {
    href: "/ayarlar",
    etiket: "Ayarlar",
    ikon: Settings,
    id: "nav-ayarlar",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarAcik, toggleSidebar, mobileSidebarAcik, setMobileSidebarAcik } = useUIStore();

  function handleNavClick() {
    if (mobileSidebarAcik) setMobileSidebarAcik(false);
  }

  // Shared sidebar inner layout
  function SidebarIcerik({ mobile = false }: { mobile?: boolean }) {
    const acik = mobile ? true : sidebarAcik;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-zinc-950 transition-colors duration-300">
        
        {/* Logo Header */}
        <div className="flex items-center h-16 px-4 border-b border-zinc-200 dark:border-zinc-900 shrink-0">
          <div className="h-10 w-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl flex items-center justify-center font-black text-base shrink-0 overflow-hidden shadow-sm">
            H
          </div>
          {acik && (
            <div className="ml-3 flex flex-col min-w-0">
              <span className="font-extrabold text-zinc-900 dark:text-white text-xs tracking-tight leading-none uppercase">
                Hilal İK
              </span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold tracking-wider mt-0.5">
                BORDRO & MUHASEBE
              </span>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const aktif = pathname === item.href || pathname.startsWith(item.href + "/");
            const Ikon = item.ikon;

            const link = (
              <Link
                key={item.id}
                id={item.id}
                href={item.yakinsa ? "#" : item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-xl py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  aktif
                    ? "bg-zinc-50 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500 pl-3 rounded-l-none"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 hover:text-zinc-900 dark:hover:text-white pl-3.5",
                  item.yakinsa && "opacity-40 cursor-not-allowed",
                  !acik && "justify-center pl-0"
                )}
                aria-current={aktif ? "page" : undefined}
              >
                <Ikon className="h-4.5 w-4.5 shrink-0" />
                {acik && (
                  <span className="truncate">
                    {item.etiket}
                    {item.yakinsa && (
                      <span className="ml-1.5 text-[9px] opacity-60">(Yakında)</span>
                    )}
                  </span>
                )}
              </Link>
            );

            if (!acik) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger className="w-full">{link}</TooltipTrigger>
                  <TooltipContent side="right">
                    {item.etiket}
                    {item.yakinsa && " (Yakında)"}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </nav>

        {/* Toggle Button — Desktop Only */}
        {!mobile && (
          <div className="border-t border-zinc-200 dark:border-zinc-900 p-2.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="w-full h-8 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
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
      {/* ── DESKTOP Sidebar (sm ve üzeri) ── */}
      <aside
        className={cn(
          "hidden sm:flex flex-col h-full border-r border-zinc-200 dark:border-zinc-900 transition-all duration-300 ease-in-out shrink-0",
          sidebarAcik ? "w-56" : "w-16"
        )}
      >
        <SidebarIcerik />
      </aside>

      {/* ── MOBİL Overlay + Drawer (sm altı) ── */}
      {/* Backdrop */}
      {mobileSidebarAcik && (
        <div
          className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 sm:hidden"
          onClick={() => setMobileSidebarAcik(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 transition-transform duration-300 ease-in-out sm:hidden",
          mobileSidebarAcik ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobil navigasyon"
      >
        <SidebarIcerik mobile />
      </aside>
    </>
  );
}
