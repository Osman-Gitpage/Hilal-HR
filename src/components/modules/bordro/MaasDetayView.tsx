"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft, User, Banknote, TrendingDown, HandCoins,
  Building2, Clock, CheckCircle2, Lock, FileEdit,
  Phone, Mail, CreditCard, Briefcase,
  Receipt, ChevronRight, RotateCcw, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useBordroDetay, useInvalidateBordro, useEskiBordro } from "@/hooks/useMaasBordro";
import { useAyarlar } from "@/hooks/useAyarlar";
import { revizyonBaslat } from "@/app/actions/maas";
import { formatPara, formatAdSoyad, formatDonem } from "@/lib/utils/index";
import { VARSAYILAN_AYLIK_CALISMA_SAATI } from "@/lib/constants";
import type { BordroNot } from "@/supabase/app-types";

// ─── Yardımcılar ───────────────────────────────────────────────
// T4.8: AY_ADLARI kaldırıldı → formatDonem kullanılıyor
// T4.8: EkKalem JSON → bordro_ek_kalem join (tip: {tutar: number}[])

function ek_toplam(kalemler: { tutar: number }[]): number {
  return kalemler.reduce((s, k) => s + (k.tutar ?? 0), 0);
}

function notlariListele(json: unknown): BordroNot[] {
  if (!Array.isArray(json)) return [];
  return json as BordroNot[];
}

// ─── Durum Badge ────────────────────────────────────────────────
function DurumBadge({ durum }: { durum: string }) {
  const MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
    taslak: { label: "Taslak", variant: "secondary", icon: FileEdit },
    kontrol_bekliyor: { label: "Kontrol Bekliyor", variant: "outline", icon: Clock },
    onaylandi: { label: "Onaylandı", variant: "default", icon: CheckCircle2 },
    kilitlendi: { label: "Kilitlendi", variant: "destructive", icon: Lock },
  };
  const a = MAP[durum] ?? MAP.taslak;
  const Ikon = a.icon;
  return (
    <Badge variant={a.variant} className="gap-1.5 text-sm px-3 py-1">
      <Ikon className="h-3.5 w-3.5" />
      {a.label}
    </Badge>
  );
}

// ─── Özet KPI Kart ──────────────────────────────────────────────
function OzetKart({
  baslik, deger, ikon: Ikon, renk, altBaslik,
}: {
  baslik: string; deger: number; ikon: React.ElementType;
  renk: string; altBaslik?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">
              {baslik}
            </p>
            <p className={`text-2xl font-bold mt-1 ${renk}`}>
              {formatPara(deger)}
            </p>
            {altBaslik && (
              <p className="text-xs text-muted-foreground mt-0.5">{altBaslik}</p>
            )}
          </div>
          <div className={`rounded-xl p-2.5 shrink-0 ${renk.includes("emerald") ? "bg-emerald-100 dark:bg-emerald-950/40" : renk.includes("rose") ? "bg-rose-100 dark:bg-rose-950/40" : "bg-amber-100 dark:bg-amber-950/40"}`}>
            <Ikon className={`h-5 w-5 ${renk}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Kalem Satırı ───────────────────────────────────────────────
function KalemSatir({
  etiket, deger, vurgula = false, renk, gizle,
}: {
  etiket: string; deger: string | number | null; vurgula?: boolean;
  renk?: string; gizle?: boolean;
}) {
  if (gizle) return null;
  const degerStr = typeof deger === "number" ? formatPara(deger) : (deger ?? "-");
  return (
    <div className={`flex items-center justify-between py-2 ${vurgula ? "border-t mt-1 pt-3" : ""}`}>
      <span className={`text-sm ${vurgula ? "font-semibold" : "text-muted-foreground"}`}>
        {etiket}
      </span>
      <span className={`text-sm font-mono ${vurgula ? `font-bold ${renk ?? ""}` : "font-medium"}`}>
        {degerStr}
      </span>
    </div>
  );
}

// ─── Bilgi Satırı (personel kartı için) ──────────────────────────
function BilgiSatir({ ikon: Ikon, etiket, deger }: {
  ikon: React.ElementType; etiket: string; deger: string | null | undefined;
}) {
  if (!deger) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
        <Ikon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{etiket}</p>
        <p className="text-sm font-medium truncate">{deger}</p>
      </div>
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────
function DetaySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Revizyon Kılıkşaılaşma Bileşeni ──────────────────────────────────────────
const KARSILASTIRMA_ALANLARI: { key: keyof import("@/supabase/app-types").MaasBordro; etiket: string; format?: "para" | "saat" | "sayi" }[] = [
  { key: "maas_net",            etiket: "Net Maaş",             format: "para" },
  { key: "calisma_saati",       etiket: "Çalışma Saati",        format: "saat" },
  { key: "mesai_saati",         etiket: "Mesai Saati",          format: "saat" },
  { key: "yol",                 etiket: "Yol",                  format: "para" },
  { key: "yemek",               etiket: "Yemek",                format: "para" },
  { key: "prim",                etiket: "Prim",                  format: "para" },
  { key: "tazminat",            etiket: "Tazminat",             format: "para" },
  { key: "senelik_izin",        etiket: "Senelik İzin Ücreti",  format: "para" },
  { key: "banka",               etiket: "Banka",                format: "para" },
  { key: "bes",                 etiket: "BES",                  format: "para" },
  { key: "avans",               etiket: "Avans",                format: "para" },
  { key: "icra",                etiket: "İcra",                 format: "para" },
  { key: "iceri_avans_kesinti", etiket: "İçeri Avans Kesinti",  format: "para" },
  { key: "iceri_avans_verilen", etiket: "Bu Ay Verilen Avans",  format: "para" },
  { key: "yillik_izin_gun",     etiket: "Yıllık İzin (gün)",   format: "sayi" },
  { key: "toplam_odeme",        etiket: "TOPLAM ÖDEME",         format: "para" },
  { key: "toplam_kesinti",      etiket: "TOPLAM KESİNTİ",       format: "para" },
  { key: "elden",               etiket: "ELDEN ÖDEME",          format: "para" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDeger(val: any, format?: "para" | "saat" | "sayi"): string {
  const n = Number(val ?? 0);
  if (format === "para") return formatPara(n);
  if (format === "saat") return `${n} saat`;
  return String(n);
}

function RevKarsilastirma({ yeniBordro, eskiBordroId }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yeniBordro: any;
  eskiBordroId: string;
}) {
  const { data: eskiBordro, isLoading } = useEskiBordro(eskiBordroId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Revizyon Karşılaştırması Yükleniyor…</CardTitle>
        </CardHeader>
      </Card>
    );
  }
  if (!eskiBordro) return null;

  const degismisler = KARSILASTIRMA_ALANLARI.filter(
    (a) => Number(eskiBordro[a.key] ?? 0) !== Number(yeniBordro[a.key] ?? 0)
  );

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-amber-500" />
          Revizyon Karşılaştırması
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            v{Number(eskiBordro.version_no)} → v{Number(yeniBordro.version_no)}
          </span>
        </CardTitle>
        {yeniBordro.revision_reason && (
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium">Neden:</span> {yeniBordro.revision_reason}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {degismisler.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Henüz hiçbir alan değişmedi.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Alan</th>
                  <th className="text-right pb-2 font-medium text-rose-600 dark:text-rose-400">Eski (v{Number(eskiBordro.version_no)})</th>
                  <th className="text-right pb-2 font-medium text-emerald-600 dark:text-emerald-400">Yeni (v{Number(yeniBordro.version_no)})</th>
                  <th className="text-right pb-2 font-medium">Fark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {degismisler.map((a) => {
                  const eski = Number(eskiBordro[a.key] ?? 0);
                  const yeni = Number(yeniBordro[a.key] ?? 0);
                  const fark = yeni - eski;
                  const isBold = ["toplam_odeme", "toplam_kesinti", "elden"].includes(a.key as string);
                  return (
                    <tr key={a.key} className={isBold ? "font-semibold bg-muted/30" : ""}>
                      <td className="py-2 text-muted-foreground">{a.etiket}</td>
                      <td className="py-2 text-right text-rose-600 dark:text-rose-400 font-mono">
                        {formatDeger(eski, a.format)}
                      </td>
                      <td className="py-2 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatDeger(yeni, a.format)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        <span className={fark >= 0 ? "text-emerald-600" : "text-rose-600"}>
                          {fark >= 0 ? "+" : ""}{formatDeger(fark, a.format)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Ana View ───────────────────────────────────────────────────
export function MaasDetayView({ bordroId }: { bordroId: string }) {
  const router = useRouter();
  const { data: bordro, isLoading, isError } = useBordroDetay(bordroId);
  const { data: ayarlar } = useAyarlar();
  const aylikCalisma = ayarlar?.aylik_calisma_saati ?? VARSAYILAN_AYLIK_CALISMA_SAATI;

  // T5.2: Revizyon dialog state
  const [revizyonAcik, setRevizyonAcik] = useState(false);
  const [revizyonNeden, setRevizyonNeden] = useState("");
  const [isPending, startTransition] = useTransition();
  const invalidate = useInvalidateBordro();

  function handleRevizyonBaslat() {
    if (!revizyonNeden.trim()) {
      toast.error("Revizyon nedeni zorunludur.");
      return;
    }
    // Dialog'u hemen kapat — double-submit önleme
    const neden = revizyonNeden.trim();
    setRevizyonAcik(false);
    setRevizyonNeden("");

    startTransition(async () => {
      const sonuc = await revizyonBaslat(bordroId, neden);
      if (sonuc.hata) {
        toast.error(sonuc.hata);
      } else {
        toast.success("Revizyon başlatıldı — bordro taslak durumuna alındı.");
        // Önce navigate et — eski pasif bordro tekrar görünmesin
        router.push("/bordro");
        // Cache arka planda temizle
        if (bordro) {
          invalidate(bordro.donem_yil, bordro.donem_ay, bordro.personel_id);
        }
      }
    });
  }

  if (isLoading) return <DetaySkeleton />;

  if (isError || !bordro) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-4xl mb-4">❌</p>
        <p className="text-lg font-semibold mb-1">Bordro bulunamadı</p>
        <p className="text-sm text-muted-foreground mb-6">
          Bu bordro kaydı mevcut değil ya da erişim yetkiniz yok.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
        </Button>
      </div>
    );
  }

  const p = bordro.personel;
  const donemAdi = formatDonem(bordro.donem_yil, bordro.donem_ay);

  // Hesaplamalar (bordro_ek_kalem join verisini kullan)
  const saatlikUcret = aylikCalisma > 0 ? bordro.maas_net / aylikCalisma : 0;
  const hakEdis = bordro.calisma_saati * saatlikUcret;
  const mesaiBedeli = bordro.mesai_saati * saatlikUcret;

  // bordro_ek_kalem join (PersonelBordroWithKalemler tipine güvenilir)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kalemler = (bordro as any).bordro_ek_kalem as { id: string; tip: string; ad: string; tutar: number }[] | undefined ?? [];
  const ekOdemeler = kalemler.filter((k) => k.tip === "odeme");
  const ekKesintiler = kalemler.filter((k) => k.tip === "kesinti");
  const ekOdeme = ek_toplam(ekOdemeler);
  const ekKesinti = ek_toplam(ekKesintiler);
  const notlar = notlariListele(bordro.notlar);

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb & Başlık ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <Link href="/bordro" className="hover:text-foreground transition-colors">
              Maaş Listesi
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">
              {formatAdSoyad(p.ad, p.soyad)}
            </span>
          </nav>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {formatAdSoyad(p.ad, p.soyad)}
            </h1>
            <DurumBadge durum={bordro.durum} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {donemAdi} dönemi bordo detayı
            {p.gorev_unvan && ` · ${p.gorev_unvan}`}
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {/* T5.2: Kilitlendi ise revizyon butonu */}
          {bordro.durum === "kilitlendi" && (
            <Button
              id="btn-revizyon-basalt"
              variant="outline"
              size="sm"
              className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={() => setRevizyonAcik(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Revizyon Başlat
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
        </div>
      </div>

      {/* ── Özet KPI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <OzetKart
          baslik="Toplam Ödeme"
          deger={bordro.toplam_odeme ?? 0}
          ikon={Banknote}
          renk="text-emerald-600 dark:text-emerald-400"
        />
        <OzetKart
          baslik="Toplam Kesinti"
          deger={bordro.toplam_kesinti ?? 0}
          ikon={TrendingDown}
          renk="text-rose-600 dark:text-rose-400"
        />
        <OzetKart
          baslik="Elden Ödeme"
          deger={bordro.elden ?? 0}
          ikon={HandCoins}
          renk="text-amber-600 dark:text-amber-400"
          altBaslik="Net el ödemesi"
        />
      </div>

      {/* ── Ana Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─ Personel Bilgileri ─ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Personel Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <BilgiSatir ikon={Briefcase} etiket="Görev / Ünvan" deger={p.gorev_unvan} />
            <BilgiSatir ikon={Phone} etiket="Telefon" deger={p.telefon} />
            <BilgiSatir ikon={Mail} etiket="E-posta" deger={p.email} />
            <BilgiSatir ikon={Building2} etiket="Banka" deger={p.banka_adi} />
            <BilgiSatir ikon={CreditCard} etiket="IBAN" deger={p.iban} />

            <Separator className="my-3" />

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Net Maaş</p>
              <p className="text-lg font-bold">{formatPara(bordro.maas_net)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Saatlik Ücret</p>
                <p className="text-sm font-semibold">{formatPara(saatlikUcret)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dönem</p>
                <p className="text-sm font-semibold">{donemAdi}</p>
              </div>
            </div>

            <Separator className="my-2" />
            <div className="text-center pt-1">
              <Link
                href={`/personel/${p.id}`}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Personel kartına git
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ─ Ödeme Kalemleri ─ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-600" />
              Ödeme Kalemleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              <KalemSatir etiket="Çalışma Saati" deger={`${bordro.calisma_saati} saat`} />
              <KalemSatir etiket="Hak Ediş" deger={hakEdis} />
              <KalemSatir
                etiket="Mesai Saati"
                deger={`${bordro.mesai_saati} saat`}
                gizle={bordro.mesai_saati === 0}
              />
              <KalemSatir
                etiket="Mesai Bedeli"
                deger={mesaiBedeli}
                gizle={bordro.mesai_saati === 0}
              />
              <KalemSatir etiket="Yol" deger={bordro.yol} gizle={bordro.yol === 0} />
              <KalemSatir etiket="Yemek" deger={bordro.yemek} gizle={bordro.yemek === 0} />
              <KalemSatir etiket="Prim" deger={bordro.prim} gizle={bordro.prim === 0} />
              <KalemSatir etiket="Tazminat" deger={bordro.tazminat} gizle={bordro.tazminat === 0} />
              <KalemSatir
                etiket="Senelik İzin Ücreti"
                deger={bordro.senelik_izin}
                gizle={bordro.senelik_izin === 0}
              />
              {/* Ek ödemeler */}
              {ekOdemeler.map((k, i) => (
                <KalemSatir key={i} etiket={k.ad || `Ek Ödeme ${i + 1}`} deger={k.tutar ?? 0} />
              ))}
              {ekOdeme > 0 && (
                <KalemSatir
                  etiket="Diğer Ödemeler Toplamı"
                  deger={ekOdeme}
                  gizle={false}
                />
              )}
            </div>
            <Separator className="my-3" />
            <KalemSatir
              etiket="TOPLAM ÖDEME"
              deger={bordro.toplam_odeme ?? 0}
              vurgula
              renk="text-emerald-600 dark:text-emerald-400"
            />
          </CardContent>
        </Card>

        {/* ─ Kesinti Kalemleri ─ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-600" />
              Kesinti Kalemleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              <KalemSatir etiket="Banka" deger={bordro.banka} gizle={bordro.banka === 0} />
              <KalemSatir etiket="BES" deger={bordro.bes} gizle={bordro.bes === 0} />
              <KalemSatir etiket="Avans" deger={bordro.avans} gizle={bordro.avans === 0} />
              <KalemSatir etiket="İcra" deger={bordro.icra} gizle={bordro.icra === 0} />
              <KalemSatir
                etiket="İçeri Avans Kesinti"
                deger={bordro.iceri_avans_kesinti}
                gizle={bordro.iceri_avans_kesinti === 0}
              />
              {/* Ek kesintiler */}
              {ekKesintiler.map((k, i) => (
                <KalemSatir key={i} etiket={k.ad || `Ek Kesinti ${i + 1}`} deger={k.tutar ?? 0} />
              ))}
              {ekKesinti > 0 && (
                <KalemSatir etiket="Diğer Kesintiler Toplamı" deger={ekKesinti} />
              )}
            </div>
            <Separator className="my-3" />
            <KalemSatir
              etiket="TOPLAM KESİNTİ"
              deger={bordro.toplam_kesinti ?? 0}
              vurgula
              renk="text-rose-600 dark:text-rose-400"
            />
            <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <HandCoins className="h-4 w-4" />
                  Elden Ödeme
                </span>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-300 font-mono">
                  {formatPara(bordro.elden ?? 0)}
                </span>
              </div>
            </div>

            {/* İçeri avans takibi */}
            {(bordro.iceri_avans_devir > 0 || bordro.iceri_avans_verilen > 0) && (
              <div className="mt-4 rounded-lg border bg-muted/40 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground mb-2">İçeri Avans Takibi</p>
                <KalemSatir etiket="Geçen Aydan Devir" deger={bordro.iceri_avans_devir ?? 0} />
                <KalemSatir etiket="Bu Ay Verilen" deger={bordro.iceri_avans_verilen ?? 0} />
                <KalemSatir etiket="Bu Ay Kesilen" deger={bordro.iceri_avans_kesinti} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Not & Açıklama */}
      {((notlar.length > 0) || bordro.aciklama) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Not &amp; Açıklama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notlar.length > 0 && (
              <ul className="space-y-1">
                {notlar.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>{n.metin}</span>
                  </li>
                ))}
              </ul>
            )}
            {bordro.aciklama && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap border-t pt-3">
                {bordro.aciklama}
              </p>
            )}
            {bordro.yillik_izin_gun > 0 && (
              <div className="flex items-center gap-2 text-sm border-t pt-3">
                <span className="text-muted-foreground">Yıllık İzin:</span>
                <span className="font-semibold">{bordro.yillik_izin_gun} gün</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Revizyon Karşılaştırması (sadece revize edilmiş bordrolar) ── */}
      {bordro.parent_bordro_id && (
        <RevKarsilastirma
          yeniBordro={bordro}
          eskiBordroId={bordro.parent_bordro_id}
        />
      )}

      {/* T5.2: Revizyon Dialog */}
      <Dialog open={revizyonAcik} onOpenChange={setRevizyonAcik}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              Revizyon Başlat
            </DialogTitle>
            <DialogDescription>
              Bu bordro kilitli durumdan taslağa alınacak. Revizyon nedeni kayıt altına alınır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="revizyon-neden">
              Revizyon Nedeni <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="revizyon-neden"
              placeholder="Örn: Mesai saati hatalı girildi, düzeltme gerekiyor…"
              value={revizyonNeden}
              onChange={(e) => setRevizyonNeden(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setRevizyonAcik(false); setRevizyonNeden(""); }}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button
              id="btn-revizyon-onayla"
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleRevizyonBaslat}
              disabled={isPending || !revizyonNeden.trim()}
            >
              {isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RotateCcw className="h-4 w-4" />
              }
              Revizyonu Başlat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
