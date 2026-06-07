"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Search, List, LayoutGrid, FileText, TrendingUp,
  TrendingDown, Minus, CheckSquare, Square, AlertCircle,
  Building2, ChevronRight, Loader2, ReceiptText, FileClock,
  FileCheck2, CreditCard, FileSpreadsheet, Ship, CalendarDays,
  ChevronUp, ChevronDown, ChevronsUpDown,
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

import { useBelgeList, useCariKpi, useFirmaList, useTopluOdemeEkle } from "@/hooks/useCari";
import { paraFormat, tarihFormat, belgeTypeName } from "@/lib/cari";
import type { BelgeListItem, BelgeTur, OdemeDurumu, ParaBirimi, BelgeListFiltre } from "@/types/cari";
import { TopluOdemeModal } from "./TopluOdemeModal";
import { BelgeImportModal } from "./BelgeImportModal";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const GORUNTULEME_KEY = "cari-goruntuleme";

// Sıralama tipi
type SiralamaSutun = "belge_no" | "tarih" | "tutar" | "kalan" | "odeme_durumu";
interface Siralama { sutun: SiralamaSutun; yon: "asc" | "desc" }

// ─── Sıralama Başlık Bileşeni ────────────────────────────────────────────────

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
      className={`flex items-center gap-1 text-xs font-bold hover:text-primary transition-colors group select-none ${className}`}
    >
      {label}
      <span className={`transition-colors ${isAktif ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}>
        {isAktif && yon === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : isAktif && yon === "desc" ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  );
}

// ─── KPI Kartı ───────────────────────────────────────────────────────────────

interface KpiKartProps {
  para_birimi: ParaBirimi;
  toplam_alacak: number;
  odenen: number;
  odenmemis: number;
}

function KpiKart({ para_birimi, toplam_alacak, odenen, odenmemis }: KpiKartProps) {
  const sembol: Record<ParaBirimi, string> = { TRY: "₺", EUR: "€", USD: "$" };
  const renk: Record<ParaBirimi, string> = {
    TRY: "from-blue-500/10 to-blue-600/5 border-blue-500/20 dark:from-blue-500/15 dark:to-blue-600/8",
    EUR: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 dark:from-emerald-500/15 dark:to-emerald-600/8",
    USD: "from-violet-500/10 to-violet-600/5 border-violet-500/20 dark:from-violet-500/15 dark:to-violet-600/8",
  };
  const iconRenk: Record<ParaBirimi, string> = {
    TRY: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    EUR: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    USD: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${renk[para_birimi]}`}
    >
      {/* Başlık */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
          {para_birimi}
        </span>
        <div className={`rounded-xl p-2 ${iconRenk[para_birimi]}`}>
          <span className="text-sm font-black">{sembol[para_birimi]}</span>
        </div>
      </div>

      {/* Değerler */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Toplam Alacak
          </span>
          <span className="text-sm font-bold tabular-nums">
            {paraFormat(toplam_alacak, para_birimi)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-emerald-500" /> Ödenen
          </span>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {paraFormat(odenen, para_birimi)}
          </span>
        </div>
        <div className="border-t border-border/40 pt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Minus className="h-3 w-3 text-amber-500" /> Kalan
          </span>
          <span
            className={`text-sm font-black tabular-nums ${
              odenmemis > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            }`}
          >
            {paraFormat(odenmemis, para_birimi)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Durum Badge ─────────────────────────────────────────────────────────────

function DurumBadge({ durum, gecikmiş }: { durum: OdemeDurumu; gecikmiş: boolean }) {
  if (gecikmiş) {
    return (
      <Badge variant="destructive" className="gap-1 text-[10px] font-bold">
        <AlertCircle className="h-2.5 w-2.5" /> Gecikmiş
      </Badge>
    );
  }
  if (durum === "odendi") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-bold gap-1">
        <FileCheck2 className="h-2.5 w-2.5" /> Ödendi
      </Badge>
    );
  }
  if (durum === "kismi") {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-[10px] font-bold gap-1">
        <FileClock className="h-2.5 w-2.5" /> Kısmi
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800 text-[10px] font-bold gap-1">
      <ReceiptText className="h-2.5 w-2.5" /> Ödenmedi
    </Badge>
  );
}

// ─── Tür Badge ────────────────────────────────────────────────────────────────

function TurBadge({ tur }: { tur: BelgeTur }) {
  const cfg: Record<BelgeTur, { label: string; cls: string }> = {
    fatura: {
      label: "FAT",
      cls: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    },
    proforma: {
      label: "PRF",
      cls: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    },
    hesap_bilgisi: {
      label: "HB",
      cls: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
    },
  };
  const { label, cls } = cfg[tur];
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-black tracking-wider px-1.5 py-0 ${cls}`}
    >
      {label}
    </Badge>
  );
}

// ─── Tablo Satırı ─────────────────────────────────────────────────────────────

interface BelgeSatiriProps {
  belge: BelgeListItem;
  secili: boolean;
  onSecToggle: () => void;
  onClick: () => void;
}

function BelgeSatiri({ belge, secili, onSecToggle, onClick }: BelgeSatiriProps) {
  const gecikmisBg = belge.gecikmiş
    ? "bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30"
    : "hover:bg-muted/50";

  return (
    <TableRow
      className={`group cursor-pointer transition-colors duration-150 ${gecikmisBg} ${secili ? "bg-primary/5 dark:bg-primary/10" : ""}`}
    >
      {/* Checkbox */}
      <TableCell
        className="w-10"
        onClick={(e) => { e.stopPropagation(); onSecToggle(); }}
      >
        <button className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          {secili ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : (
            <Square className="h-4 w-4 opacity-40 group-hover:opacity-80" />
          )}
        </button>
      </TableCell>

      {/* Satır içeriği — tıklanınca detay */}
      <TableCell onClick={onClick} className="font-mono text-xs font-bold tracking-wide">
        {belge.belge_no}
      </TableCell>
      <TableCell onClick={onClick}>
        <TurBadge tur={belge.tur} />
      </TableCell>
      <TableCell onClick={onClick} className="text-sm text-muted-foreground whitespace-nowrap">
        {tarihFormat(belge.tarih)}
      </TableCell>
      <TableCell onClick={onClick} className="max-w-[160px] truncate text-sm">
        {belge.aciklama}
      </TableCell>
      {/* Gemi Adı */}
      <TableCell onClick={onClick}>
        {belge.gemi_adi ? (
          <span className="flex items-center gap-1 text-sm">
            <Ship className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[100px]">{belge.gemi_adi}</span>
          </span>
        ) : (
          <span className="text-muted-foreground/40 text-xs">—</span>
        )}
      </TableCell>
      <TableCell onClick={onClick}>
        {belge.firma_ad ? (
          <span className="flex items-center gap-1 text-sm">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[120px]">{belge.firma_ad}</span>
          </span>
        ) : (
          <span className="text-muted-foreground/40 text-xs">—</span>
        )}
      </TableCell>
      <TableCell onClick={onClick} className="text-right font-semibold tabular-nums text-sm whitespace-nowrap">
        {paraFormat(belge.tutar, belge.para_birimi)}
        {belge.para_birimi !== "TRY" && belge.kur !== 1 && (
          <div className="text-[10px] text-muted-foreground/60 font-normal">
            kur: {belge.kur.toFixed(2)}
          </div>
        )}
      </TableCell>
      <TableCell onClick={onClick} className="text-right tabular-nums text-sm whitespace-nowrap">
        {belge.kalan > 0 ? (
          <span className={belge.gecikmiş ? "text-rose-600 dark:text-rose-400 font-bold" : "text-amber-600 dark:text-amber-400 font-semibold"}>
            {paraFormat(
              belge.para_birimi !== "TRY" && belge.kur > 0
                ? belge.kalan / belge.kur
                : belge.kalan,
              belge.para_birimi
            )}
          </span>
        ) : (
          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">✓ Kapandı</span>
        )}
      </TableCell>
      <TableCell onClick={onClick}>
        <DurumBadge durum={belge.odeme_durumu} gecikmiş={belge.gecikmiş} />
      </TableCell>
      <TableCell onClick={onClick} className="w-8">
        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </TableCell>
    </TableRow>
  );
}

// ─── Izgara Kartı ─────────────────────────────────────────────────────────────

interface BelgeKartiProps {
  belge: BelgeListItem;
  secili: boolean;
  onSecToggle: () => void;
  onClick: () => void;
}

function BelgeKarti({ belge, secili, onSecToggle, onClick }: BelgeKartiProps) {
  return (
    <div
      className={`group relative rounded-2xl border bg-card p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${belge.gecikmiş ? "border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20" : "hover:border-primary/20"}
        ${secili ? "border-primary ring-2 ring-primary/20" : ""}
      `}
      onClick={onClick}
    >
      {/* Checkbox */}
      <button
        className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors z-10"
        onClick={(e) => { e.stopPropagation(); onSecToggle(); }}
      >
        {secili ? (
          <CheckSquare className="h-4 w-4 text-primary" />
        ) : (
          <Square className="h-4 w-4 opacity-30 group-hover:opacity-70" />
        )}
      </button>

      {/* Üst: Tür + No */}
      <div className="flex items-center gap-2 mb-1 pr-6">
        <TurBadge tur={belge.tur} />
        <span className="font-mono text-xs font-bold text-muted-foreground truncate">
          {belge.belge_no}
        </span>
      </div>

      {/* Açıklama */}
      <p className="text-sm font-semibold truncate mb-1">{belge.aciklama}</p>

      {/* Gemi */}
      {belge.gemi_adi && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1 truncate">
          <Ship className="h-3 w-3 shrink-0" />
          {belge.gemi_adi}
        </p>
      )}

      {/* Firma */}
      {belge.firma_ad && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3 truncate">
          <Building2 className="h-3 w-3 shrink-0" />
          {belge.firma_ad}
        </p>
      )}

      {/* Tarih */}
      <p className="text-xs text-muted-foreground mb-3">{tarihFormat(belge.tarih)}</p>

      {/* Ayrım */}
      <div className="border-t border-border/40 pt-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Tutar</span>
          <span className="text-sm font-bold tabular-nums">
            {paraFormat(belge.tutar, belge.para_birimi)}
          </span>
        </div>
        {belge.kalan > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Kalan</span>
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
        <div className="pt-1">
          <DurumBadge durum={belge.odeme_durumu} gecikmiş={belge.gecikmiş} />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ListeSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

function IzgaraSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-52 w-full rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export function BelgeListesiView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Görüntüleme modu (localStorage'da kalıcı)
  const [goruntuleme, setGoruntuleme] = React.useState<"liste" | "izgara">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(GORUNTULEME_KEY) as "liste" | "izgara") ?? "liste";
    }
    return "liste";
  });

  // Filtreler
  const [arama, setArama] = React.useState(() => searchParams.get("arama") ?? "");
  const [tur, setTur] = React.useState<BelgeTur | "tumu">(() => {
    const t = searchParams.get("tur");
    if (t === "fatura" || t === "proforma" || t === "hesap_bilgisi") return t;
    return "tumu";
  });
  const [durum, setDurum] = React.useState<OdemeDurumu | "tumu">(() => {
    const d = searchParams.get("durum");
    if (d === "odendi" || d === "kismi" || d === "odenmedi") return d;
    return "tumu";
  });
  const [firmaId, setFirmaId] = React.useState<string>(() => {
    const p = searchParams.get("firmaId");
    // Eski URL'lerde "yok" gelirse __yok'a çevir
    if (p === "yok") return "__yok";
    return p ?? "tumu";
  });
  const [aramaDebounce, setAramaDebounce] = React.useState(arama);
  // Yıl filtresi — varsayılan: mevcut yıl
  const mevcutYil = new Date().getFullYear();
  const [yil, setYil] = React.useState<number>(() => {
    const y = searchParams.get("yil");
    if (y) {
      const parsed = Number(y);
      if (!isNaN(parsed)) return parsed;
    }
    return mevcutYil;
  });
  const yilSecenekleri = Array.from(
    { length: mevcutYil - 2019 },
    (_, i) => mevcutYil - i
  );

  // Debounce arama
  React.useEffect(() => {
    const t = setTimeout(() => setAramaDebounce(arama), 350);
    return () => clearTimeout(t);
  }, [arama]);

  // Filtre durumunu URL query parametreleriyle eşitle (detaya gidip gelince sıfırlanmasın diye)
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (aramaDebounce) {
      params.set("arama", aramaDebounce);
    }
    if (tur !== "tumu") {
      params.set("tur", tur);
    }
    if (durum !== "tumu") {
      params.set("durum", durum);
    }
    if (firmaId !== "tumu") {
      params.set("firmaId", firmaId);
    }
    if (yil !== mevcutYil) {
      params.set("yil", String(yil));
    }

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [aramaDebounce, tur, durum, firmaId, yil, mevcutYil]);

  // Seçili belgeler (toplu ödeme)
  const [seciliIds, setSeciliIds] = React.useState<Set<string>>(new Set());
  const [topluOdemeAcik, setTopluOdemeAcik] = React.useState(false);

  const filtre: BelgeListFiltre = {
    tur: tur !== "tumu" ? tur : undefined,
    durum: durum !== "tumu" ? durum : undefined,
    arama: aramaDebounce || undefined,
    firma_id: firmaId !== "tumu" ? firmaId : undefined,
    yil,
  };

  // Boş durum mesajında firma yok filtresini de say
  const herhangiBirFiltre = !!(arama || tur !== "tumu" || durum !== "tumu" || firmaId !== "tumu");

  const { data: belgeler = [], isLoading: belgeYukleniyor } = useBelgeList(filtre);
  const { data: kpiData = [], isLoading: kpiYukleniyor } = useCariKpi(yil);
  const { data: firmalar = [] } = useFirmaList();

  // Görüntüleme değişince localStorage'a kaydet
  const handleGoruntuleme = (mod: "liste" | "izgara") => {
    setGoruntuleme(mod);
    localStorage.setItem(GORUNTULEME_KEY, mod);
  };

  // Seçim toggle
  const toggleSec = (id: string) => {
    setSeciliIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tumunuSec = () => {
    if (seciliIds.size === belgeler.length) {
      setSeciliIds(new Set());
    } else {
      setSeciliIds(new Set(belgeler.map((b) => b.id)));
    }
  };

  const seciliBelgeler = belgeler.filter((b) => seciliIds.has(b.id));
  const [importModalAcik, setImportModalAcik] = React.useState(false);

  // ─── Sıralama state ───
  const [siralama, setSiralama] = React.useState<Siralama | null>(null);

  const siralamaToggle = (sutun: SiralamaSutun) => {
    setSiralama((prev) => {
      if (!prev || prev.sutun !== sutun) return { sutun, yon: "asc" };
      if (prev.yon === "asc") return { sutun, yon: "desc" };
      return null; // üçüncü tıkta sıfırla
    });
  };

  // Sıralanmış liste
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

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-24">
        {/* ── Sayfa Başlığı ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Cari / Fatura</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Belge, ödeme ve firma yönetimi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/cari/firma")}
              className="gap-1.5"
            >
              <Building2 className="h-3.5 w-3.5" />
              Firmalar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalAcik(true)}
              className="gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel İçe Aktar
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/cari/belge/yeni")}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Yeni Belge
            </Button>
          </div>
        </div>

        {/* ── KPI Kartları ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpiYukleniyor
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))
            : kpiData.map((k) => (
                <KpiKart key={k.para_birimi} {...k} />
              ))}
        </div>

        {/* ── Filtre Çubuğu ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Arama */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Belge no, açıklama, firma, gemi…"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Yıl filtresi */}
          <Select value={String(yil)} onValueChange={(v) => setYil(Number(v))}>
            <SelectTrigger className="h-9 text-sm w-[110px]">
              <CalendarDays className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yilSecenekleri.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Firma */}
          <Select value={firmaId} onValueChange={(v) => setFirmaId(v ?? "tumu")}>
            <SelectTrigger className="h-9 text-sm w-[160px]">
              <SelectValue placeholder="Firma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tumu">Tüm Firmalar</SelectItem>
              <SelectItem value="__yok">Firma Yok</SelectItem>
              {firmalar.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.ad}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tür */}
          <Select value={tur} onValueChange={(v) => setTur(v as BelgeTur | "tumu")}>
            <SelectTrigger className="h-9 text-sm w-[160px]">
              <SelectValue placeholder="Tür" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tumu">Tüm Türler</SelectItem>
              <SelectItem value="fatura">Fatura</SelectItem>
              <SelectItem value="proforma">Proforma</SelectItem>
              <SelectItem value="hesap_bilgisi">Hesap Bilgisi</SelectItem>
            </SelectContent>
          </Select>

          {/* Durum */}
          <Select value={durum} onValueChange={(v) => setDurum(v as OdemeDurumu | "tumu")}>
            <SelectTrigger className="h-9 text-sm w-[150px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tumu">Tüm Durumlar</SelectItem>
              <SelectItem value="odenmedi">Ödenmedi</SelectItem>
              <SelectItem value="kismi">Kısmi Ödendi</SelectItem>
              <SelectItem value="odendi">Ödendi</SelectItem>
            </SelectContent>
          </Select>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Liste / Izgara Toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Tooltip>
              <TooltipTrigger
                onClick={() => handleGoruntuleme("liste")}
                className={`p-2 transition-colors ${
                  goruntuleme === "liste"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <List className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Liste</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                onClick={() => handleGoruntuleme("izgara")}
                className={`p-2 transition-colors ${
                  goruntuleme === "izgara"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Izgara</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ── İçerik ── */}
        {belgeYukleniyor ? (
          goruntuleme === "liste" ? <ListeSkeleton /> : <IzgaraSkeleton />
        ) : belgeler.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-base font-semibold text-muted-foreground">
              {herhangiBirFiltre
                ? "Filtreyle eşleşen belge bulunamadı"
                : "Henüz belge eklenmemiş"}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {herhangiBirFiltre
                ? "Filtreleri temizleyerek tüm belgelere bakabilirsiniz"
                : "Yeni belge eklemek için sağ üstteki butonu kullanın"}
            </p>
            {!herhangiBirFiltre && (
              <Button
                className="mt-4 gap-1.5"
                onClick={() => router.push("/cari/belge/yeni")}
              >
                <Plus className="h-4 w-4" />
                İlk Belgeyi Ekle
              </Button>
            )}
          </div>
        ) : goruntuleme === "liste" ? (
          /* ─ Tablo ─ */
          <div className="rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-10">
                    <button
                      onClick={tumunuSec}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {seciliIds.size === belgeler.length && belgeler.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <SiralamaBaslik label="Belge No" sutun="belge_no" aktif={siralama?.sutun ?? null} yon={siralama?.yon ?? null} onClick={siralamaToggle} />
                  </TableHead>
                  <TableHead className="text-xs font-bold">Tür</TableHead>
                  <TableHead>
                    <SiralamaBaslik label="Tarih" sutun="tarih" aktif={siralama?.sutun ?? null} yon={siralama?.yon ?? null} onClick={siralamaToggle} />
                  </TableHead>
                  <TableHead className="text-xs font-bold">Açıklama</TableHead>
                  <TableHead className="text-xs font-bold">Gemi</TableHead>
                  <TableHead className="text-xs font-bold">Firma</TableHead>
                  <TableHead className="text-right">
                    <SiralamaBaslik label="Tutar" sutun="tutar" aktif={siralama?.sutun ?? null} yon={siralama?.yon ?? null} onClick={siralamaToggle} className="justify-end w-full" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SiralamaBaslik label="Kalan" sutun="kalan" aktif={siralama?.sutun ?? null} yon={siralama?.yon ?? null} onClick={siralamaToggle} className="justify-end w-full" />
                  </TableHead>
                  <TableHead>
                    <SiralamaBaslik label="Durum" sutun="odeme_durumu" aktif={siralama?.sutun ?? null} yon={siralama?.yon ?? null} onClick={siralamaToggle} />
                  </TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {siraliiBelgeler.map((belge) => (
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
          </div>
        ) : (
          /* ─ Izgara ─ */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {belgeler.map((belge) => (
              <BelgeKarti
                key={belge.id}
                belge={belge}
                secili={seciliIds.has(belge.id)}
                onSecToggle={() => toggleSec(belge.id)}
                onClick={() => router.push(`/cari/belge/${belge.id}`)}
              />
            ))}
          </div>
        )}

        {/* ── Toplu Seçim Alt Çubuğu ── */}
        {seciliIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 bg-card border rounded-2xl shadow-2xl px-5 py-3">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                {seciliIds.size} belge seçildi
              </span>
              <div className="h-4 w-px bg-border" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSeciliIds(new Set())}
                className="text-xs h-7"
              >
                Temizle
              </Button>
              <Button
                size="sm"
                className="gap-1.5 h-7 text-xs"
                onClick={() => setTopluOdemeAcik(true)}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Toplu Ödeme Ekle
              </Button>
            </div>
          </div>
        )}

        {/* ── Toplu Ödeme Modal ── */}
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

        {/* ── Excel Import Modal ── */}
        <BelgeImportModal
          acik={importModalAcik}
          onKapat={() => setImportModalAcik(false)}
        />
      </div>
    </TooltipProvider>
  );
}

