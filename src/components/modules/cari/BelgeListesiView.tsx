"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Search, List, LayoutGrid, FileText, TrendingUp,
  CheckSquare, Square, AlertCircle,
  Building2, ChevronRight, Loader2, ReceiptText, FileClock,
  FileCheck2, CreditCard, FileSpreadsheet, Ship, CalendarDays,
  ChevronUp, ChevronDown, ChevronsUpDown, SlidersHorizontal,
  X, Sparkles, ChevronLeft,
  Download, FileDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useBelgeList, useCariKpi, useFirmaList } from "@/hooks/useCari";
import { paraFormat, tarihFormat } from "@/lib/cari";
import type { BelgeListItem, BelgeTur, OdemeDurumu, ParaBirimi, BelgeListFiltre } from "@/types/cari";
import { TopluOdemeModal } from "./TopluOdemeModal";
import { BelgeImportModal } from "./BelgeImportModal";
import { cariListeExcel } from "@/lib/excel/cariExport";
import { cariListePdf, seciliBelgelerPdf } from "@/lib/pdf/cariPdf";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const GORUNTULEME_KEY = "cari-goruntuleme";
const SAYFA_BOYUTU = 25;

type SiralamaSutun = "belge_no" | "tarih" | "tutar" | "kalan" | "odeme_durumu";
interface Siralama { sutun: SiralamaSutun; yon: "asc" | "desc" }

// ─── Belge Tür Seçici ────────────────────────────────────────────────────────

type TurSecim = BelgeTur | "tumu";

const TUR_SECENEKLERI: {
  deger: TurSecim;
  baslik: string;
  altBaslik: string;
  ikon: React.ElementType;
  renk: string;
  aktifRenk: string;
}[] = [
  {
    deger: "tumu",
    baslik: "Tüm Belgeler",
    altBaslik: "Bütün kayıtlar",
    ikon: FileSpreadsheet,
    renk: "text-slate-500 dark:text-slate-400",
    aktifRenk: "border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900",
  },
  {
    deger: "fatura",
    baslik: "Resmi Fatura",
    altBaslik: "Vergi faturası",
    ikon: FileText,
    renk: "text-blue-500 dark:text-blue-400",
    aktifRenk: "border-blue-600 bg-blue-600 text-white",
  },
  {
    deger: "proforma",
    baslik: "Proforma",
    altBaslik: "Ön fatura",
    ikon: FileClock,
    renk: "text-purple-500 dark:text-purple-400",
    aktifRenk: "border-purple-600 bg-purple-600 text-white",
  },
  {
    deger: "hesap_bilgisi",
    baslik: "Hesap Bilgisi",
    altBaslik: "Borç/alacak notu",
    ikon: ReceiptText,
    renk: "text-amber-500 dark:text-amber-400",
    aktifRenk: "border-amber-500 bg-amber-500 text-white",
  },
];

function BelgeTurSecici({
  secili,
  onChange,
  sayilar,
}: {
  secili: TurSecim;
  onChange: (t: TurSecim) => void;
  sayilar: Record<TurSecim, number>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {TUR_SECENEKLERI.map(({ deger, baslik, altBaslik, ikon: Ikon, renk, aktifRenk }) => {
        const aktif = secili === deger;
        return (
          <button
            key={deger}
            onClick={() => onChange(deger)}
            className={`group relative rounded-xl border p-4 text-left transition-all duration-200
              hover:-translate-y-0.5 hover:shadow-md
              ${
                aktif
                  ? aktifRenk + " shadow-sm"
                  : "bg-card border-border/60 hover:border-border"
              }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center
                ${aktif ? "bg-white/20" : "bg-muted/60"}`}>
                <Ikon className={`h-4 w-4 ${aktif ? "text-current" : renk}`} />
              </div>
              <span className={`text-xs font-black tabular-nums
                ${aktif ? "text-current opacity-80" : "text-muted-foreground"}`}>
                {sayilar[deger] ?? 0}
              </span>
            </div>
            <p className={`text-sm font-bold leading-tight ${
              aktif ? "text-current" : "text-foreground"
            }`}>{baslik}</p>
            <p className={`text-[11px] mt-0.5 ${
              aktif ? "text-current opacity-70" : "text-muted-foreground"
            }`}>{altBaslik}</p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Para Birimi Paleti ───────────────────────────────────────────────────────────────

const PB_CFG: Record<ParaBirimi, {
  sembol: string;
  bar: string;
  barBg: string;
  accent: string;
  label: string;
}> = {
  TRY: {
    sembol: "₺",
    bar: "bg-violet-500",
    barBg: "bg-violet-100 dark:bg-violet-950/40",
    accent: "text-violet-600 dark:text-violet-400",
    label: "Türk Lirası",
  },
  EUR: {
    sembol: "€",
    bar: "bg-emerald-500",
    barBg: "bg-emerald-100 dark:bg-emerald-950/40",
    accent: "text-emerald-600 dark:text-emerald-400",
    label: "Euro",
  },
  USD: {
    sembol: "$",
    bar: "bg-amber-500",
    barBg: "bg-amber-100 dark:bg-amber-950/40",
    accent: "text-amber-600 dark:text-amber-400",
    label: "Amerikan Doları",
  },
};

// ─── KPI Kartı ───────────────────────────────────────────────────────────────

interface KpiKartProps {
  para_birimi: ParaBirimi;
  toplam_alacak: number;
  odenen: number;
  odenmemis: number;
}

function KpiKart({ para_birimi, toplam_alacak, odenen, odenmemis }: KpiKartProps) {
  const cfg = PB_CFG[para_birimi];
  const pct = toplam_alacak > 0 ? Math.round((odenen / toplam_alacak) * 100) : 0;
  const tamKapandi = odenmemis === 0 && toplam_alacak > 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-4
      hover:border-border transition-all duration-200 hover:shadow-sm">

      {/* Üst satır: para birimi + sembol */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tabular-nums leading-none">
            {cfg.sembol}
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground leading-none">{para_birimi}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{cfg.label}</p>
          </div>
        </div>
        {tamKapandi && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600
            dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200
            dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
            <FileCheck2 className="h-2.5 w-2.5" /> Tamamlandı
          </span>
        )}
      </div>

      {/* Ana rakam */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
          Toplam Alacak
        </p>
        <p className="text-2xl font-black tabular-nums tracking-tight leading-none">
          {paraFormat(toplam_alacak, para_birimi)}
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Tahsilat oranı</span>
          <span className={`font-bold tabular-nums ${cfg.accent}`}>{pct}%</span>
        </div>
        <div className={`h-1 rounded-full ${cfg.barBg} overflow-hidden`}>
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Alt satır: ödenen / kalan */}
      <div className="flex items-center gap-0 divide-x divide-border/50">
        <div className="flex-1 pr-4">
          <p className="text-[10px] text-muted-foreground mb-0.5">Ödenen</p>
          <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {paraFormat(odenen, para_birimi)}
          </p>
        </div>
        <div className="flex-1 pl-4">
          <p className="text-[10px] text-muted-foreground mb-0.5">Kalan</p>
          <p className={`text-sm font-bold tabular-nums ${
            odenmemis > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/50"
          }`}>
            {odenmemis > 0 ? paraFormat(odenmemis, para_birimi) : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Durum Badge ─────────────────────────────────────────────────────────────

function DurumBadge({ durum, gecikmiş }: { durum: OdemeDurumu; gecikmiş: boolean }) {
  if (gecikmiş) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
        <AlertCircle className="h-2.5 w-2.5" /> Gecikmiş
      </span>
    );
  }
  if (durum === "odendi") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
        <FileCheck2 className="h-2.5 w-2.5" /> Ödendi
      </span>
    );
  }
  if (durum === "kismi") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
        <FileClock className="h-2.5 w-2.5" /> Kısmi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
      <ReceiptText className="h-2.5 w-2.5" /> Ödenmedi
    </span>
  );
}

// ─── Tür Badge ────────────────────────────────────────────────────────────────

function TurBadge({ tur }: { tur: BelgeTur }) {
  const cfg: Record<BelgeTur, { label: string; cls: string }> = {
    fatura: {
      label: "FAT",
      cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40",
    },
    proforma: {
      label: "PRF",
      cls: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/40",
    },
    hesap_bilgisi: {
      label: "HB",
      cls: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/40",
    },
  };
  const { label, cls } = cfg[tur];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-wider border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Sıralama Başlık ─────────────────────────────────────────────────────────

function SiralamaBaslik({
  label, sutun, aktif, yon, onClick, className = "",
}: {
  label: string;
  sutun: SiralamaSutun;
  aktif: SiralamaSutun | null;
  yon: "asc" | "desc" | null;
  onClick: (s: SiralamaSutun) => void;
  className?: string;
}) {
  const isAktif = aktif === sutun;
  return (
    <button
      onClick={() => onClick(sutun)}
      className={`flex items-center gap-1 text-xs font-semibold hover:text-foreground transition-colors group select-none ${
        isAktif ? "text-foreground" : "text-muted-foreground"
      } ${className}`}
    >
      {label}
      <span className={`transition-colors ${isAktif ? "text-primary" : "text-muted-foreground/30 group-hover:text-muted-foreground"}`}>
        {isAktif && yon === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : isAktif && yon === "desc" ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3" />
        )}
      </span>
    </button>
  );
}

// ─── Tablo Satırı ─────────────────────────────────────────────────────────────

function BelgeSatiri({ belge, secili, onSecToggle, onClick }: {
  belge: BelgeListItem;
  secili: boolean;
  onSecToggle: () => void;
  onClick: () => void;
}) {
  return (
    <TableRow
      className={`group cursor-pointer transition-all duration-150 border-0 border-b border-border/50
        ${belge.gecikmiş ? "bg-rose-50/40 dark:bg-rose-950/15 hover:bg-rose-50/70 dark:hover:bg-rose-950/25" : "hover:bg-muted/40"}
        ${secili ? "bg-primary/5 dark:bg-primary/8" : ""}
      `}
    >
      <TableCell className="w-10 py-3" onClick={(e) => { e.stopPropagation(); onSecToggle(); }}>
        <button className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          {secili ? (
            <CheckSquare className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Square className="h-3.5 w-3.5 opacity-30 group-hover:opacity-60" />
          )}
        </button>
      </TableCell>
      <TableCell onClick={onClick} className="py-3 font-mono text-xs font-bold tracking-wide text-foreground/80">
        {belge.belge_no}
      </TableCell>
      <TableCell onClick={onClick} className="py-3">
        <TurBadge tur={belge.tur} />
      </TableCell>
      <TableCell onClick={onClick} className="py-3 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
        {tarihFormat(belge.tarih)}
      </TableCell>
      <TableCell onClick={onClick} className="py-3 max-w-[150px] truncate text-sm text-foreground/90">
        {belge.aciklama}
      </TableCell>
      <TableCell onClick={onClick} className="py-3">
        {belge.gemi_adi ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Ship className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[90px]">{belge.gemi_adi}</span>
          </span>
        ) : (
          <span className="text-muted-foreground/25 text-xs">—</span>
        )}
      </TableCell>
      <TableCell onClick={onClick} className="py-3">
        {belge.firma_ad ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[100px]">{belge.firma_ad}</span>
          </span>
        ) : (
          <span className="text-muted-foreground/25 text-xs">—</span>
        )}
      </TableCell>
      <TableCell onClick={onClick} className="py-3 text-right font-bold tabular-nums text-sm">
        {paraFormat(belge.tutar, belge.para_birimi)}
        {belge.para_birimi !== "TRY" && belge.kur !== 1 && (
          <div className="text-[10px] text-muted-foreground/50 font-normal">kur {belge.kur.toFixed(2)}</div>
        )}
      </TableCell>
      <TableCell onClick={onClick} className="py-3 text-right tabular-nums text-sm">
        {belge.kalan > 0 ? (
          <span className={`font-semibold ${belge.gecikmiş ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}`}>
            {paraFormat(
              belge.para_birimi !== "TRY" && belge.kur > 0
                ? belge.kalan / belge.kur
                : belge.kalan,
              belge.para_birimi
            )}
          </span>
        ) : (
          <span className="text-emerald-500 dark:text-emerald-400 text-[11px] font-semibold">✓ Kapandı</span>
        )}
      </TableCell>
      <TableCell onClick={onClick} className="py-3">
        <DurumBadge durum={belge.odeme_durumu} gecikmiş={belge.gecikmiş} />
      </TableCell>
      <TableCell onClick={onClick} className="py-3 w-8">
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </TableCell>
    </TableRow>
  );
}

// ─── Izgara Kartı ─────────────────────────────────────────────────────────────

function BelgeKarti({ belge, secili, onSecToggle, onClick }: {
  belge: BelgeListItem;
  secili: boolean;
  onSecToggle: () => void;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl border bg-card p-5 cursor-pointer transition-all duration-200
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5
        ${belge.gecikmiş
          ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10"
          : secili
          ? "border-primary/40 ring-2 ring-primary/10"
          : "border-border/60 hover:border-border"
        }`}
    >
      {/* Checkbox */}
      <button
        className="absolute top-3.5 right-3.5 text-muted-foreground hover:text-primary transition-colors z-10"
        onClick={(e) => { e.stopPropagation(); onSecToggle(); }}
      >
        {secili ? (
          <CheckSquare className="h-4 w-4 text-primary" />
        ) : (
          <Square className="h-4 w-4 opacity-20 group-hover:opacity-50" />
        )}
      </button>

      {/* Üst */}
      <div className="flex items-center gap-2 mb-2 pr-7">
        <TurBadge tur={belge.tur} />
        <span className="font-mono text-[11px] font-bold text-muted-foreground/60 truncate">
          {belge.belge_no}
        </span>
      </div>

      <p className="text-sm font-semibold truncate mb-3 text-foreground/90">{belge.aciklama}</p>

      {/* Meta */}
      <div className="space-y-1 mb-3">
        {belge.gemi_adi && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
            <Ship className="h-3 w-3 shrink-0 opacity-60" />
            {belge.gemi_adi}
          </p>
        )}
        {belge.firma_ad && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
            <Building2 className="h-3 w-3 shrink-0 opacity-60" />
            {belge.firma_ad}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3 shrink-0" />
          {tarihFormat(belge.tarih)}
        </p>
      </div>

      {/* Alt */}
      <div className="border-t border-border/40 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Tutar</span>
          <span className="text-sm font-bold tabular-nums">{paraFormat(belge.tutar, belge.para_birimi)}</span>
        </div>
        {belge.kalan > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Kalan</span>
            <span className={`text-sm font-semibold tabular-nums ${belge.gecikmiş ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}`}>
              {paraFormat(
                belge.para_birimi !== "TRY" && belge.kur > 0
                  ? belge.kalan / belge.kur
                  : belge.kalan,
                belge.para_birimi
              )}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <DurumBadge durum={belge.odeme_durumu} gecikmiş={belge.gecikmiş} />
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ListeSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border/30 last:border-0">
          <Skeleton className="h-3.5 w-3.5 rounded shrink-0" />
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-4 w-8 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-32 rounded flex-1" />
          <Skeleton className="h-3 w-16 rounded ml-auto" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function IzgaraSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-52 rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export function BelgeListesiView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [goruntuleme, setGoruntuleme] = React.useState<"liste" | "izgara">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(GORUNTULEME_KEY) as "liste" | "izgara") ?? "liste";
    }
    return "liste";
  });

  const [arama, setArama] = React.useState(() => searchParams.get("arama") ?? "");
  const [tur, setTur] = React.useState<BelgeTur | "tumu">(() => {
    const t = searchParams.get("tur");
    if (t === "fatura" || t === "proforma" || t === "hesap_bilgisi") return t;
    return "tumu";
  });
  // Çoklu durum filtresi — %2C ve virgül ayrıştırma güvencesi
  const parseDurumParam = (dParam: string | null): Set<OdemeDurumu> => {
    const durumSet = new Set<OdemeDurumu>();
    if (dParam) {
      const decoded = decodeURIComponent(dParam).replace(/%2C/gi, ",");
      decoded.split(",").forEach((item) => {
        const clean = item.trim().toLowerCase();
        if (clean === "odendi" || clean === "kismi" || clean === "odenmedi") {
          durumSet.add(clean as OdemeDurumu);
        }
      });
    }
    return durumSet;
  };

  const [seciliDurumlar, setSeciliDurumlar] = React.useState<Set<OdemeDurumu>>(() => {
    return parseDurumParam(searchParams.get("durum"));
  });
  const [firmaId, setFirmaId] = React.useState<string>(() => {
    const p = searchParams.get("firmaId");
    if (p === "yok") return "__yok";
    return p ?? "tumu";
  });
  // aramaDebounce — URL'den gelen ilk değerle senkronize başlar
  const [aramaDebounce, setAramaDebounce] = React.useState(() => searchParams.get("arama") ?? "");
  const mevcutYil = new Date().getFullYear();
  const [yil, setYil] = React.useState<number>(() => {
    const y = searchParams.get("yil");
    if (y) {
      const parsed = Number(y);
      if (!isNaN(parsed)) return parsed;
    }
    return mevcutYil;
  });
  const yilSecenekleri = Array.from({ length: mevcutYil - 2019 }, (_, i) => mevcutYil - i);

  const [filtrePanelAcik, setFiltrePanelAcik] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setAramaDebounce(arama), 350);
    return () => clearTimeout(t);
  }, [arama]);

  // Filtre/arama/yıl değişince sayfayı sıfırla
  React.useEffect(() => { setSayfa(1); }, [aramaDebounce, seciliDurumlar, firmaId, yil]);

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (aramaDebounce) params.set("arama", aramaDebounce);
    if (tur !== "tumu") params.set("tur", tur);
    if (seciliDurumlar.size > 0) params.set("durum", [...seciliDurumlar].join(","));
    if (firmaId !== "tumu") params.set("firmaId", firmaId);
    if (yil !== mevcutYil) params.set("yil", String(yil));
    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [aramaDebounce, tur, seciliDurumlar, firmaId, yil, mevcutYil]);

  const [seciliIds, setSeciliIds] = React.useState<Set<string>>(new Set());
  const [topluOdemeAcik, setTopluOdemeAcik] = React.useState(false);
  const [importModalAcik, setImportModalAcik] = React.useState(false);
  const [sayfa, setSayfa] = React.useState(1);
  const [exportMenuAcik, setExportMenuAcik] = React.useState(false);
  const [exportYukleniyor, setExportYukleniyor] = React.useState<"excel" | "pdf" | "secili-pdf" | null>(null);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  // Dışa tıklama ile menu kapat
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuAcik(false);
      }
    };
    if (exportMenuAcik) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportMenuAcik]);

  const handleExcelExport = async () => {
    setExportYukleniyor("excel");
    setExportMenuAcik(false);
    try {
      cariListeExcel(siraliiBelgeler, { yil });
    } finally {
      setExportYukleniyor(null);
    }
  };

  const handlePdfExport = async () => {
    setExportYukleniyor("pdf");
    setExportMenuAcik(false);
    try {
      // Aktif filtreleri PDF'e yaz
      const durumEtiketleri: Record<OdemeDurumu, string> = {
        odendi: "Ödendi", kismi: "Kısmi", odenmedi: "Ödenmedi",
      };
      const aktifFiltreler = [
        ...[...seciliDurumlar].map((d) => durumEtiketleri[d]),
        ...(tur !== "tumu" ? [tur === "fatura" ? "Resmi Fatura" : tur === "proforma" ? "Proforma" : "Hesap Bilgisi"] : []),
      ].join(", ") || undefined;

      const seciliFirmaObj = firmalar.find((f) => f.id === firmaId);
      await cariListePdf(siraliiBelgeler, {
        baslik: seciliFirmaObj ? `${seciliFirmaObj.ad} — Cari Hesap Ekstresi` : "Cari Belge ve Hesap Ekstresi",
        donem: `${yil} Yılı`,
        firmaAdi: seciliFirmaObj?.ad,
        aktifFiltreler,
      });
    } finally {
      setExportYukleniyor(null);
    }
  };

  const handleSeciliPdfExport = async () => {
    setExportYukleniyor("secili-pdf");
    try {
      await seciliBelgelerPdf(seciliBelgeler);
    } finally {
      setExportYukleniyor(null);
    }
  };

  const filtre: BelgeListFiltre = {
    tur: tur !== "tumu" ? tur : undefined,
    durumlar: seciliDurumlar.size > 0 ? [...seciliDurumlar] : undefined,
    arama: aramaDebounce || undefined,
    firma_id: firmaId !== "tumu" ? firmaId : undefined,
    yil,
  };

  const herhangiBirFiltre = !!(arama || tur !== "tumu" || seciliDurumlar.size > 0 || firmaId !== "tumu");

  const { data: belgeler = [], isLoading: belgeYukleniyor } = useBelgeList(filtre);
  const { data: kpiData = [], isLoading: kpiYukleniyor } = useCariKpi(yil);
  const { data: firmalar = [] } = useFirmaList();

  const handleGoruntuleme = (mod: "liste" | "izgara") => {
    setGoruntuleme(mod);
    localStorage.setItem(GORUNTULEME_KEY, mod);
  };

  const toggleSec = (id: string) => {
    setSeciliIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // "Tümünü seç" — sadece mevcut sayfadaki belgeleri seçer/kaldırır
  const tumunuSec = () => {
    const sayfaIdleri = sayfaBelgeleri.map((b) => b.id);
    const hepsiSecili = sayfaIdleri.every((id) => seciliIds.has(id));
    setSeciliIds((prev) => {
      const next = new Set(prev);
      if (hepsiSecili) {
        sayfaIdleri.forEach((id) => next.delete(id));
      } else {
        sayfaIdleri.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const seciliBelgeler = belgeler.filter((b) => seciliIds.has(b.id));

  const [siralama, setSiralama] = React.useState<Siralama | null>(null);

  const siralamaToggle = (sutun: SiralamaSutun) => {
    setSiralama((prev) => {
      if (!prev || prev.sutun !== sutun) return { sutun, yon: "asc" };
      if (prev.yon === "asc") return { sutun, yon: "desc" };
      return null;
    });
  };

  const siraliiBelgeler = React.useMemo(() => {
    if (!siralama) return belgeler;
    return [...belgeler].sort((a, b) => {
      const { sutun, yon } = siralama;
      let cmp = 0;
      if (sutun === "belge_no") cmp = a.belge_no.localeCompare(b.belge_no, "tr");
      else if (sutun === "tarih") cmp = a.tarih.localeCompare(b.tarih);
      else if (sutun === "tutar") cmp = a.tutar * a.kur - b.tutar * b.kur;
      else if (sutun === "kalan") cmp = a.kalan - b.kalan;
      else if (sutun === "odeme_durumu") {
        const s: Record<string, number> = { odenmedi: 0, kismi: 1, odendi: 2 };
        cmp = (s[a.odeme_durumu] ?? 0) - (s[b.odeme_durumu] ?? 0);
      }
      return yon === "asc" ? cmp : -cmp;
    });
  }, [belgeler, siralama]);

  // Sayfalama
  const toplamSayfa = Math.max(1, Math.ceil(siraliiBelgeler.length / SAYFA_BOYUTU));
  const sayfaBelgeleri = siraliiBelgeler.slice((sayfa - 1) * SAYFA_BOYUTU, sayfa * SAYFA_BOYUTU);

  // Tür değişince sayfayı sıfırla
  const handleTurDegis = (t: TurSecim) => {
    setTur(t);
    setSayfa(1);
  };

  // Tür sayıları (client-side, yüklü veriden)
  const turSayilari = React.useMemo(() => {
    const sayim: Record<TurSecim, number> = { tumu: belgeler.length, fatura: 0, proforma: 0, hesap_bilgisi: 0 };
    for (const b of belgeler) sayim[b.tur] = (sayim[b.tur] ?? 0) + 1;
    return sayim;
  }, [belgeler]);

  // Aktif filtre sayısı (tür hariç — tür artık kart seçici aracılığıyla yönetiliyor)
  const aktifFiltreSayisi = [seciliDurumlar.size > 0, firmaId !== "tumu"].filter(Boolean).length;

  return (
    <TooltipProvider>
      <div className="space-y-5 pb-24">

        {/* ── Sayfa Başlığı ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary/60" />
              <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                Cari Yönetimi
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Belgeler & Ödemeler
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/cari/firma")}
              className="gap-1.5 h-9 text-muted-foreground hover:text-foreground"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Firmalar</span>
            </Button>

            {/* Dışa Aktar Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportMenuAcik((p) => !p)}
                disabled={belgeler.length === 0 || exportYukleniyor !== null}
                className="gap-1.5 h-9"
              >
                {exportYukleniyor === "excel" || exportYukleniyor === "pdf" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Dışa Aktar</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>

              {exportMenuAcik && (
                <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border/60 bg-popover shadow-xl z-50
                  animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
                  <div className="px-3 py-2 border-b border-border/40">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {siraliiBelgeler.length} belge
                    </p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleExcelExport}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs">Excel (.xlsx)</p>
                        <p className="text-[10px] text-muted-foreground">Detay + özet sayfası</p>
                      </div>
                    </button>
                    <button
                      onClick={handlePdfExport}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                        <FileDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs">PDF Raporu</p>
                        <p className="text-[10px] text-muted-foreground">Tam liste, baskıya hazır</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalAcik(true)}
              className="gap-1.5 h-9"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">İçe Aktar</span>
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/cari/belge/yeni")}
              className="gap-1.5 h-9"
            >
              <Plus className="h-3.5 w-3.5" />
              Yeni Belge
            </Button>
          </div>
        </div>

        {/* ── KPI Kartları ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {kpiYukleniyor
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))
            : kpiData.length === 0
            ? (
              <div className="col-span-3 rounded-2xl border border-dashed border-border/60 p-8 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{yil} yılına ait veri bulunamadı</p>
              </div>
            )
            : kpiData.map((k) => <KpiKart key={k.para_birimi} {...k} />)
          }
        </div>

        {/* ── Belge Tür Seçici ── */}
        {!belgeYukleniyor && (
          <BelgeTurSecici
            secili={tur}
            onChange={handleTurDegis}
            sayilar={turSayilari}
          />
        )}
        {belgeYukleniyor && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {/* ── Filtre & Görüntüleme Çubuğu ── */}
        <div className="flex flex-col gap-3">
          {/* Üst Satır: Arama + Yıl + Görüntüleme + Filtre */}
          <div className="flex items-center gap-2.5">
            {/* Arama */}
            <div className="relative flex-1 min-w-0 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
              <Input
                placeholder="Ara… belge, firma, gemi"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/30 border-transparent focus:border-border focus:bg-background transition-all"
              />
              {arama && (
                <button
                  onClick={() => setArama("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Yıl */}
            <Select value={String(yil)} onValueChange={(v) => setYil(Number(v))}>
              <SelectTrigger className="h-9 text-sm w-[105px] bg-muted/30 border-transparent focus:border-border">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/60 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yilSecenekleri.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre toggle */}
            <button
              onClick={() => setFiltrePanelAcik((p) => !p)}
              className={`relative h-9 px-3 rounded-lg border text-sm flex items-center gap-1.5 transition-all
                ${filtrePanelAcik || aktifFiltreSayisi > 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/30 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs font-medium">Filtreler</span>
              {aktifFiltreSayisi > 0 && (
                <span className="ml-0.5 h-4 w-4 rounded-full bg-white/20 text-[10px] font-black flex items-center justify-center">
                  {aktifFiltreSayisi}
                </span>
              )}
            </button>

            {/* Sayfa konumu */}
            {!belgeYukleniyor && siraliiBelgeler.length > SAYFA_BOYUTU && (
              <span className="text-xs text-muted-foreground">
                {sayfa}/{toplamSayfa} sayfa
              </span>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Liste / Izgara */}
            <div className="flex items-center gap-0.5 p-0.5 bg-muted/40 rounded-lg border border-border/40">
              <Tooltip>
                <TooltipTrigger
                  onClick={() => handleGoruntuleme("liste")}
                  className={`p-1.5 rounded-md transition-all ${
                    goruntuleme === "liste"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Liste görünümü</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  onClick={() => handleGoruntuleme("izgara")}
                  className={`p-1.5 rounded-md transition-all ${
                    goruntuleme === "izgara"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Izgara görünümü</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Filtre Paneli */}
          {filtrePanelAcik && (
            <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Ödeme Durumu — Çoklu Seçim Chip'leri */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-full">
                  Ödeme Durumu
                </span>
                {([
                  { deger: "odenmedi" as OdemeDurumu, etiket: "Ödenmedi", renkAktif: "bg-slate-700 text-white border-slate-700", renkPasif: "border-slate-200 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400" },
                  { deger: "kismi"    as OdemeDurumu, etiket: "Kısmi",    renkAktif: "bg-amber-500 text-white border-amber-500", renkPasif: "border-amber-200 text-amber-700 hover:border-amber-400 dark:border-amber-800 dark:text-amber-400" },
                  { deger: "odendi"   as OdemeDurumu, etiket: "Ödendi",   renkAktif: "bg-emerald-600 text-white border-emerald-600", renkPasif: "border-emerald-200 text-emerald-700 hover:border-emerald-400 dark:border-emerald-800 dark:text-emerald-400" },
                ] as const).map(({ deger, etiket, renkAktif, renkPasif }) => {
                  const aktif = seciliDurumlar.has(deger);
                  return (
                    <button
                      key={deger}
                      onClick={() => {
                        setSeciliDurumlar((prev) => {
                          const next = new Set(prev);
                          if (next.has(deger)) next.delete(deger);
                          else next.add(deger);
                          return next;
                        });
                        setSayfa(1);
                      }}
                      className={`flex items-center gap-1.5 h-7 px-3 rounded-full border text-xs font-semibold transition-all duration-150
                        ${aktif ? renkAktif + " shadow-sm" : "bg-background " + renkPasif}
                      `}
                    >
                      {aktif && <CheckSquare className="h-3 w-3" />}
                      {etiket}
                    </button>
                  );
                })}
                {seciliDurumlar.size > 0 && (
                  <button
                    onClick={() => { setSeciliDurumlar(new Set()); setSayfa(1); }}
                    className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-2.5 w-2.5" /> Sıfırla
                  </button>
                )}
              </div>

              {/* Firma Seçici */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-full">
                  Firma
                </span>
                <Select value={firmaId} onValueChange={(v) => { setFirmaId(v ?? "tumu"); setSayfa(1); }}>
                  <SelectTrigger className="h-8 text-xs w-[200px] bg-background">
                    <SelectValue placeholder="Tüm Firmalar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tumu">Tüm Firmalar</SelectItem>
                    <SelectItem value="__yok">Firma Yok</SelectItem>
                    {firmalar.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.ad}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {aktifFiltreSayisi > 0 && (
                  <button
                    onClick={() => { setSeciliDurumlar(new Set()); setFirmaId("tumu"); setSayfa(1); }}
                    className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="h-3 w-3" /> Tüm Filtreleri Temizle
                  </button>
                )}

                {!belgeYukleniyor && (
                  <span className="ml-auto text-xs text-muted-foreground font-medium">
                    {belgeler.length} belge
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── İçerik ── */}
        {belgeYukleniyor ? (
          goruntuleme === "liste" ? <ListeSkeleton /> : <IzgaraSkeleton />
        ) : belgeler.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <p className="text-base font-semibold text-foreground/70">
              {herhangiBirFiltre ? "Sonuç bulunamadı" : "Henüz belge yok"}
            </p>
            <p className="text-sm text-muted-foreground/50 mt-1 max-w-xs">
              {herhangiBirFiltre
                ? "Filtrelerinizi değiştirerek tekrar deneyin"
                : "Yeni belge ekleyerek başlayabilirsiniz"}
            </p>
            {!herhangiBirFiltre && (
              <Button
                className="mt-5 gap-1.5"
                onClick={() => router.push("/cari/belge/yeni")}
              >
                <Plus className="h-4 w-4" />
                İlk Belgeyi Ekle
              </Button>
            )}
            {herhangiBirFiltre && (
              <button
                onClick={() => { setArama(""); setTur("tumu"); setSeciliDurumlar(new Set()); setFirmaId("tumu"); }}
                className="mt-4 text-sm text-primary hover:underline flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" /> Filtreleri temizle
              </button>
            )}
          </div>
        ) : goruntuleme === "liste" ? (
          /* ─ Tablo ─ */
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/50">
                  <TableHead className="w-10 py-3">
                    <button
                      onClick={tumunuSec}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {sayfaBelgeleri.length > 0 && sayfaBelgeleri.every((b) => seciliIds.has(b.id)) ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="py-3">
                    <SiralamaBaslik label="Belge No" sutun="belge_no" aktif={siralama?.sutun ?? null} yon={siralama?.yon ?? null} onClick={siralamaToggle} />
                  </TableHead>
                  <TableHead className="py-3 text-xs font-semibold text-muted-foreground">Tür</TableHead>
                  <TableHead className="py-3">
                    <SiralamaBaslik label="Tarih" sutun="tarih" aktif={siralama?.sutun ?? null} yon={siralama?.yon ?? null} onClick={siralamaToggle} />
                  </TableHead>
                  <TableHead className="py-3 text-xs font-semibold text-muted-foreground">Açıklama</TableHead>
                  <TableHead className="py-3 text-xs font-semibold text-muted-foreground">Gemi</TableHead>
                  <TableHead className="py-3 text-xs font-semibold text-muted-foreground">Firma</TableHead>
                  <TableHead className="py-3 text-right">
                    <SiralamaBaslik label="Tutar" sutun="tutar" aktif={siralama?.sutun ?? null} yon={siralama?.yon ?? null} onClick={siralamaToggle} className="justify-end w-full" />
                  </TableHead>
                  <TableHead className="py-3 text-right">
                    <SiralamaBaslik label="Kalan" sutun="kalan" aktif={siralama?.sutun ?? null} yon={siralama?.yon ?? null} onClick={siralamaToggle} className="justify-end w-full" />
                  </TableHead>
                  <TableHead className="py-3">
                    <SiralamaBaslik label="Durum" sutun="odeme_durumu" aktif={siralama?.sutun ?? null} yon={siralama?.yon ?? null} onClick={siralamaToggle} />
                  </TableHead>
                  <TableHead className="w-8 py-3" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sayfaBelgeleri.map((belge) => (
                  <BelgeSatiri
                    key={belge.id}
                    belge={belge}
                    secili={seciliIds.has(belge.id)}
                    onSecToggle={() => toggleSec(belge.id)}
                    onClick={() => router.push(`/cari/belge/${belge.id}`)}
                  />
                ))}
              </TableBody>
            </Table>
            {/* Alt footer: bilgi + sayfalama */}
            <div className="px-4 py-2.5 border-t border-border/30 bg-muted/10 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {((sayfa - 1) * SAYFA_BOYUTU) + 1}–{Math.min(sayfa * SAYFA_BOYUTU, siraliiBelgeler.length)} / {siraliiBelgeler.length} belge
                {seciliIds.size > 0 && (
                  <span className="text-primary font-semibold ml-2">· {seciliIds.size} seçili</span>
                )}
              </span>
              {toplamSayfa > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSayfa((p) => Math.max(1, p - 1))}
                    disabled={sayfa === 1}
                    className="h-7 w-7 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground
                      hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  {Array.from({ length: toplamSayfa }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === toplamSayfa || Math.abs(p - sayfa) <= 1)
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="text-xs text-muted-foreground px-1">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setSayfa(p as number)}
                          className={`h-7 min-w-[28px] px-2 rounded-lg text-xs font-semibold transition-all
                            ${
                              sayfa === p
                                ? "bg-foreground text-background"
                                : "border border-border/60 text-muted-foreground hover:bg-muted"
                            }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setSayfa((p) => Math.min(toplamSayfa, p + 1))}
                    disabled={sayfa === toplamSayfa}
                    className="h-7 w-7 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground
                      hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ─ Izgara ─ */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {sayfaBelgeleri.map((belge) => (
                <BelgeKarti
                  key={belge.id}
                  belge={belge}
                  secili={seciliIds.has(belge.id)}
                  onSecToggle={() => toggleSec(belge.id)}
                  onClick={() => router.push(`/cari/belge/${belge.id}`)}
                />
              ))}
            </div>
            {/* Izgara sayfalama */}
            {toplamSayfa > 1 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground">
                  {((sayfa - 1) * SAYFA_BOYUTU) + 1}–{Math.min(sayfa * SAYFA_BOYUTU, siraliiBelgeler.length)} / {siraliiBelgeler.length} belge
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSayfa((p) => Math.max(1, p - 1))}
                    disabled={sayfa === 1}
                    className="h-7 w-7 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground
                      hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  {Array.from({ length: toplamSayfa }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === toplamSayfa || Math.abs(p - sayfa) <= 1)
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`g-ellipsis-${i}`} className="text-xs text-muted-foreground px-1">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setSayfa(p as number)}
                          className={`h-7 min-w-[28px] px-2 rounded-lg text-xs font-semibold transition-all
                            ${
                              sayfa === p
                                ? "bg-foreground text-background"
                                : "border border-border/60 text-muted-foreground hover:bg-muted"
                            }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setSayfa((p) => Math.min(toplamSayfa, p + 1))}
                    disabled={sayfa === toplamSayfa}
                    className="h-7 w-7 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground
                      hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Toplu Seçim Alt Çubuğu ── */}
        {seciliIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-3 bg-foreground text-background rounded-2xl shadow-2xl shadow-black/20 px-5 py-2.5 border border-white/10">
              <CheckSquare className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold whitespace-nowrap">
                {seciliIds.size} belge seçildi
              </span>
              <div className="h-4 w-px bg-white/20" />
              <button
                onClick={() => setSeciliIds(new Set())}
                className="text-xs opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Temizle
              </button>
              <Button
                size="sm"
                onClick={handleSeciliPdfExport}
                disabled={exportYukleniyor === "secili-pdf"}
                className="gap-1.5 h-7 text-xs bg-white/15 text-white hover:bg-white/25 border border-white/20"
              >
                {exportYukleniyor === "secili-pdf" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileDown className="h-3.5 w-3.5" />
                )}
                PDF
              </Button>
              <Button
                size="sm"
                onClick={() => setTopluOdemeAcik(true)}
                className="gap-1.5 h-7 text-xs bg-white text-foreground hover:bg-white/90"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Toplu Ödeme
              </Button>
            </div>
          </div>
        )}

        {/* ── Modals ── */}
        {topluOdemeAcik && (
          <TopluOdemeModal
            belgeler={seciliBelgeler}
            acik={topluOdemeAcik}
            onKapat={() => {
              setTopluOdemeAcik(false);
              setSeciliIds(new Set());
            }}
          />
        )}
        <BelgeImportModal
          acik={importModalAcik}
          onKapat={() => setImportModalAcik(false)}
        />
      </div>
    </TooltipProvider>
  );
}
