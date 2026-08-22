"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Save, Loader2, Plus, Building2,
  Hash, Calendar, FileText, DollarSign, RefreshCw,
  Info, Ship,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useBelgeDetay,
  useBelgeEkle,
  useBelgeGuncelle,
  useFirmaList,
} from "@/hooks/useCari";
import { belgeNoOner, bugunYYYYMMDD, paraFormat, formatKur } from "@/lib/cari";
import { sonrakiBelgeNoGetir } from "@/app/actions/cari";
import type { BelgeTur, ParaBirimi, BelgePayload } from "@/types/cari";
import { HelpInfo } from "@/components/ui/help-info";

interface BelgeFormViewProps {
  /** Düzenleme modunda belge ID'si. Tanımsızsa yeni ekleme. */
  belgeId?: string;
}

const TUR_OPTIONS: { value: BelgeTur; label: string; desc: string }[] = [
  { value: "fatura", label: "Fatura", desc: "Kesilmiş vergi faturası" },
  { value: "proforma", label: "Proforma", desc: "Teklif / ön fatura" },
  { value: "hesap_bilgisi", label: "Hesap Bilgisi", desc: "Hesap ekstresi" },
];

const PB_OPTIONS: { value: ParaBirimi; label: string; sembol: string }[] = [
  { value: "TRY", label: "Türk Lirası", sembol: "₺" },
  { value: "EUR", label: "Euro", sembol: "€" },
  { value: "USD", label: "Dolar", sembol: "$" },
];

// ─── Alan Wrapper ──────────────────────────────────────────────────────────

function FormAlani({
  label,
  required,
  hint,
  helpTitle,
  helpDesc,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  helpTitle?: React.ReactNode;
  helpDesc?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {hint && (
          <span className="text-[10px] text-muted-foreground/70 font-normal">
            {hint}
          </span>
        )}
        {helpDesc && (
          <HelpInfo title={helpTitle || label} description={helpDesc} side="right" />
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────

export function BelgeFormView({ belgeId }: BelgeFormViewProps) {
  const router = useRouter();
  const duzenleme = !!belgeId;

  const { data: mevcutBelge, isLoading: belgeYukleniyor } = useBelgeDetay(
    duzenleme ? belgeId! : null
  );
  const { data: firmalar = [], isLoading: firmaYukleniyor } = useFirmaList();

  const { mutateAsync: belgeEkle, isPending: ekleniyor } = useBelgeEkle();
  const { mutateAsync: belgeGuncelle, isPending: guncelleniyor } = useBelgeGuncelle();

  const isPending = ekleniyor || guncelleniyor;

  // ── Form State
  const [tur, setTur] = React.useState<BelgeTur>("fatura");
  const [belgeNo, setBelgeNo] = React.useState("");
  const [tarih, setTarih] = React.useState(bugunYYYYMMDD());
  const [aciklama, setAciklama] = React.useState("");
  const [tutar, setTutar] = React.useState("");
  const [paraBirimi, setParaBirimi] = React.useState<ParaBirimi>("TRY");
  const [kur, setKur] = React.useState("1");
  const [firmaId, setFirmaId] = React.useState<string>("yok");
  const [gemiAdi, setGemiAdi] = React.useState("");
  const [notlar, setNotlar] = React.useState("");

  // Hesaplama
  const tutarNum = parseFloat(tutar.replace(",", ".")) || 0;
  const kurNum = parseFloat(kur.replace(",", ".")) || 1;
  const tlKarsiligi = tutarNum * kurNum;

  // Düzenleme: mevcut veriyi forma doldur
  React.useEffect(() => {
    if (duzenleme && mevcutBelge) {
      setTur(mevcutBelge.tur as BelgeTur);
      setBelgeNo(mevcutBelge.belge_no);
      setTarih(mevcutBelge.tarih);
      setAciklama(mevcutBelge.aciklama);
      setTutar(mevcutBelge.tutar.toString());
      setParaBirimi(mevcutBelge.para_birimi);
      setKur(mevcutBelge.kur.toString());
      setFirmaId(mevcutBelge.firma_id ?? "yok");
      setGemiAdi(mevcutBelge.gemi_adi ?? "");
      setNotlar(mevcutBelge.notlar ?? "");
    }
  }, [duzenleme, mevcutBelge]);

  // Yeni belgede tür değişince otomatik belge no öner
  const handleTurDegis = async (yeniTur: BelgeTur) => {
    setTur(yeniTur);
    if (!duzenleme) {
      try {
        const sira = await sonrakiBelgeNoGetir(yeniTur);
        setBelgeNo(belgeNoOner(yeniTur, sira));
      } catch {
        setBelgeNo(belgeNoOner(yeniTur, 1));
      }
    }
  };

  // İlk yüklemede belge no öner (yeni mod)
  React.useEffect(() => {
    if (!duzenleme) {
      handleTurDegis("fatura");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duzenleme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTutar = parseFloat(tutar.replace(",", "."));
    if (!parsedTutar || parsedTutar <= 0) {
      toast.error("Geçerli bir tutar giriniz.");
      return;
    }
    const parsedKur = parseFloat(kur.replace(",", ".")) || 1;

    const payload: BelgePayload = {
      tur,
      belge_no: belgeNo.trim(),
      tarih,
      aciklama: aciklama.trim(),
      gemi_adi: gemiAdi.trim() || null,
      tutar: parsedTutar,
      para_birimi: paraBirimi,
      kur: parsedKur,
      firma_id: firmaId !== "yok" ? firmaId : null,
      notlar: notlar.trim() || null,
    };

    if (duzenleme) {
      const sonuc = await belgeGuncelle({ id: belgeId!, payload });
      if (!sonuc.basarili) { toast.error(`Hata: ${sonuc.hata}`); return; }
      toast.success("Belge güncellendi.");
      router.push(`/cari/belge/${belgeId}`);
    } else {
      const sonuc = await belgeEkle(payload);
      if (!sonuc.basarili) { toast.error(`Hata: ${sonuc.hata}`); return; }
      toast.success("Belge oluşturuldu.");
      router.push(`/cari/belge/${sonuc.veri.id}`);
    }
  };

  // Yükleniyor (düzenleme modu)
  if (duzenleme && belgeYukleniyor) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-[520px] rounded-2xl" />
      </div>
    );
  }

  const secilenPB = PB_OPTIONS.find((o) => o.value === paraBirimi)!;

  return (
    <div className="max-w-2xl space-y-6 pb-12">
      {/* ── Başlık ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 -ml-2 mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              {duzenleme ? "Belge Düzenle" : "Yeni Belge"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {duzenleme
                ? `${mevcutBelge?.belge_no ?? ""} düzenleniyor`
                : "Fatura, proforma veya hesap bilgisi ekle"}
            </p>
          </div>
        </div>
        {duzenleme && mevcutBelge && (
          <Badge variant="outline" className="mt-1 shrink-0">
            {mevcutBelge.belge_no}
          </Badge>
        )}
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Kart 1: Kimlik Bilgileri */}
        <div className="rounded-2xl border bg-card divide-y divide-border overflow-hidden">
          <div className="px-5 py-3 bg-muted/30">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Belge Bilgileri
            </p>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            {/* Tür */}
            <FormAlani
              label="Belge Türü"
              required
              helpDesc="Fatura: Resmi vergi faturası. Proforma: Ön fatura/teklif. Hesap Bilgisi: Cari ekstre/alacak kaydı."
            >
              <Select value={tur} onValueChange={(v) => handleTurDegis(v as BelgeTur)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TUR_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <div>
                        <span className="font-semibold">{o.label}</span>
                        <span className="text-muted-foreground text-xs ml-1.5">{o.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormAlani>

            {/* Belge No */}
            <FormAlani label="Belge No" required>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={belgeNo}
                  onChange={(e) => setBelgeNo(e.target.value)}
                  required
                  placeholder="FAT-001"
                  className="h-9 text-sm font-mono pl-9"
                />
              </div>
            </FormAlani>

            {/* Tarih */}
            <FormAlani label="Tarih" required>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  required
                  className="h-9 text-sm pl-9"
                />
              </div>
            </FormAlani>

            {/* Firma */}
            <FormAlani
              label="Firma"
              hint="(isteğe bağlı)"
              helpDesc="Belgenin ilişkilendirileceği cari firma hesabıdır. Borç/alacak takibi için seçilmesi önerilir."
            >
              <div className="flex gap-2">
                <Select value={firmaId} onValueChange={(v) => setFirmaId(v ?? "yok")}>
                  <SelectTrigger className="h-9 text-sm flex-1">
                    <SelectValue placeholder="Firma seçin…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yok">
                      <span className="text-muted-foreground">Firma seçilmedi</span>
                    </SelectItem>
                    {firmaYukleniyor ? (
                      <SelectItem value="__loading" disabled>Yükleniyor…</SelectItem>
                    ) : (
                      firmalar.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {f.ad}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => router.push("/cari/firma?yeni=1")}
                  title="Yeni firma ekle"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </FormAlani>
          </div>

          {/* Açıklama — tam genişlik */}
          <div className="px-5 pb-3">
            <FormAlani label="Açıklama" required>
              <Input
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                required
                placeholder="Hizmet açıklaması, proje adı, dönem…"
                className="h-9 text-sm"
              />
            </FormAlani>
          </div>

          {/* Gemi Adı — tam genişlik, opsiyonel */}
          <div className="px-5 pb-5">
            <FormAlani label="Gemi Adı" hint="(isteğe bağlı)">
              <div className="relative">
                <Ship className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={gemiAdi}
                  onChange={(e) => setGemiAdi(e.target.value)}
                  placeholder="M/V Vessel Name…"
                  className="h-9 text-sm pl-9"
                />
              </div>
            </FormAlani>
          </div>
        </div>

        {/* Kart 2: Finansal Bilgiler */}
        <div className="rounded-2xl border bg-card divide-y divide-border overflow-hidden">
          <div className="px-5 py-3 bg-muted/30">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Finansal Bilgiler
            </p>
          </div>
          <div className="p-5 grid grid-cols-3 gap-4">
            {/* Para Birimi */}
            <FormAlani label="Para Birimi" required>
              <Select
                value={paraBirimi}
                onValueChange={(v) => {
                  setParaBirimi(v as ParaBirimi);
                  if (v === "TRY") setKur("1");
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PB_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-bold w-5 text-center">{o.sembol}</span>
                        <span>{o.value}</span>
                        <span className="text-muted-foreground text-xs">— {o.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormAlani>

            {/* Tutar */}
            <FormAlani label="Tutar" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  {secilenPB.sembol}
                </span>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={tutar}
                  onChange={(e) => setTutar(e.target.value)}
                  required
                  placeholder="0.00"
                  className="h-9 text-sm text-right tabular-nums pl-8"
                />
              </div>
            </FormAlani>

            {/* Kur */}
            <FormAlani
              label="Kur"
              hint="(TL)"
              helpDesc="Dövizli işlemlerde 1 birim yabancı paranın TL cinsinden kur değeridir."
            >
              <div className="relative">
                <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min="0.0000000001"
                  step="any"
                  placeholder="1.0000"
                  value={kur}
                  onChange={(e) => setKur(e.target.value)}
                  disabled={paraBirimi === "TRY"}
                  className="h-9 text-sm text-right tabular-nums pl-9 disabled:opacity-50"
                />
              </div>
            </FormAlani>

            {/* TL Karşılığı (Doğrudan girilebilir) */}
            {paraBirimi !== "TRY" && (
              <FormAlani
                label="Toplam TL Karşılığı"
                hint="(Hedef TL)"
                helpDesc="Hedef TL tutarını doğrudan yazdığınızda kur otomatik 10 haneli hassasiyetle tersine hesaplanır."
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    ₺
                  </span>
                  <Input
                    type="number"
                    min="0.01"
                    step="any"
                    placeholder="93200.00"
                    value={tutarNum > 0 && kurNum > 0 ? (tutarNum * kurNum).toFixed(2) : ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace(",", "."));
                      if (val > 0 && tutarNum > 0) {
                        // Kuru 10 ondalık hassasiyetle otomatik hesapla
                        const hesaplananKur = (val / tutarNum).toFixed(10).replace(/0+$/, "").replace(/\.$/, "");
                        setKur(hesaplananKur);
                      }
                    }}
                    className="h-9 text-sm text-right tabular-nums pl-7 bg-primary/5 font-medium border-primary/20"
                  />
                </div>
              </FormAlani>
            )}
          </div>

          {/* TL Karşılığı özet */}
          {tutarNum > 0 && (
            <div className="px-5 py-3 flex items-center justify-between bg-primary/5 border-t border-primary/10">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                <span>Net TL Tutarı</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-primary tabular-nums">
                  {paraFormat(tlKarsiligi, "TRY")}
                </span>
                {paraBirimi !== "TRY" && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({paraFormat(tutarNum, paraBirimi)} × {formatKur(kurNum)})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Kart 3: Notlar */}
        <div className="rounded-2xl border bg-card divide-y divide-border overflow-hidden">
          <div className="px-5 py-3 bg-muted/30">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Notlar
              <span className="text-muted-foreground/60 font-normal normal-case ml-1">(isteğe bağlı)</span>
            </p>
          </div>
          <div className="p-5">
            <Textarea
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              placeholder="İç notlar, hatırlatıcılar, özel bilgiler…"
              className="resize-none h-24 text-sm"
            />
          </div>
        </div>

        {/* ── Aksiyon Butonları ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isPending}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="gap-2 min-w-[140px]"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending
              ? "Kaydediliyor…"
              : duzenleme
              ? "Değişiklikleri Kaydet"
              : "Belge Oluştur"}
          </Button>
        </div>
      </form>
    </div>
  );
}
