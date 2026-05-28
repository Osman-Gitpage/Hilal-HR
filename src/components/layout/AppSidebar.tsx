"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  DollarSign,
  ClipboardList,
  Receipt,
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
    yakinsa: true,
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
    // Mobil drawer açıksa nav linke tıklayınca kapat
    if (mobileSidebarAcik) setMobileSidebarAcik(false);
  }

  // Sidebar içeriği — desktop ve mobile drawer için ortak
  function SidebarIcerik({ mobile = false }: { mobile?: boolean }) {
    const acik = mobile ? true : sidebarAcik;

    return (
      <>
        {/* Logo */}
        <div className="flex items-center h-16 px-3 border-b shrink-0">
          <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/favicon.png"
              alt="Favicon"
              className="w-full h-full object-contain"
            />
          </div>
          {acik && (
            <span className="ml-3 font-bold text-sidebar-foreground text-sm truncate">
              HILAL MUHASEBE
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
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
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                  aktif
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  item.yakinsa && "opacity-40 cursor-not-allowed",
                  !acik && "justify-center"
                )}
                aria-current={aktif ? "page" : undefined}
              >
                <Ikon className="h-4 w-4 shrink-0" />
                {acik && (
                  <span className="truncate">
                    {item.etiket}
                    {item.yakinsa && (
                      <span className="ml-1 text-[10px] opacity-60">(Yakında)</span>
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

        {/* Toggle Button — sadece desktop'ta göster */}
        {!mobile && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="w-full h-8 text-sidebar-foreground hover:bg-sidebar-accent"
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
      </>
    );
  }

  return (
    <>
      {/* ── DESKTOP Sidebar (sm ve üzeri) ── */}
      <aside
        className={cn(
          "hidden sm:flex flex-col h-full border-r bg-sidebar transition-all duration-300 ease-in-out shrink-0",
          sidebarAcik ? "w-56" : "w-16"
        )}
      >
        <SidebarIcerik />
      </aside>

      {/* ── MOBİL Overlay + Drawer (sm altı) ── */}
      {/* Backdrop */}
      {mobileSidebarAcik && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setMobileSidebarAcik(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r bg-sidebar transition-transform duration-300 ease-in-out sm:hidden",
          mobileSidebarAcik ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobil navigasyon"
      >
        <SidebarIcerik mobile />
      </aside>
    </>
  );
}
