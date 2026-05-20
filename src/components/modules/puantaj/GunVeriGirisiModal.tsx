"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Sun, Sunset, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { OZEL_DURUMLAR } from "@/lib/constants";
import { useGunVeriGir, useGunVeriSil } from "@/hooks/usePuantaj";
import type { OzelDurum, PuantajGunVerisi } from "@/types";

// ─────────────────────────────────────────────
// Tarih Formatla  →  "Çarşamba, 15 Nisan 2025"
// ─────────────────────────────────────────────
const AY_ADLARI = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const GUN_ADLARI = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function tarihFormatla(tarih: string): string {
  const [yil, ay, gun] = tarih.split("-").map(Number);
  const d = new Date(yil, ay - 1, gun);
  return `${GUN_ADLARI[d.getDay()]}, ${gun} ${AY_ADLARI[ay]} ${yil}`;
}

// ─────────────────────────────────────────────
// Saatlerden çalışma saatini hesapla
// ─────────────────────────────────────────────
function hesaplaCalismaSaati(giris: string, cikis: string): number | null {
  if (!giris || !cikis) return null;
  const [gh, gm] = giris.split(":").map(Number);
  const [ch, cm] = cikis.split(":").map(Number);
  const dakika = ch * 60 + cm - (gh * 60 + gm);
  if (dakika <= 0) return null;
  return Math.round((dakika / 60) * 100) / 100;
}

function hesaplaMesaiSaatiFn(baslangic: string, bitis: string): number | null {
  if (!baslangic || !bitis) return null;
  const [bh, bm] = baslangic.split(":").map(Number);
  const [eh, em] = bitis.split(":").map(Number);
  const dakika = eh * 60 + em - (bh * 60 + bm);
  if (dakika <= 0) return null;
  return Math.round((dakika / 60) * 100) / 100;
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface GunVeriGirisiModalProps {
  acik: boolean;
  personelId: string;
  personelAd: string;
  tarih: string; // "YYYY-MM-DD"
  mevcutVeri?: {
    giris_saati?: string | null;
    cikis_saati?: string | null;
    calisma_saati?: number | null;
    ozel_durum?: string | null;
    aciklama?: string | null;
    mesai_saati?: number | null;
  };
  yil: number;
  ay: number;
  onKapat: () => void;
  /** Proje sayfasında override edilir; tanımlıysa genel mutation yerine çalışır */
  onKaydetOverride?: (veri: PuantajGunVerisi) => Promise<{ hata?: string; basarili?: boolean } | undefined>;
  /** Proje sayfasında override edilir; tanımlıysa genel silme yerine çalışır */
  onSilOverride?: () => Promise<{ hata?: string; basarili?: boolean } | undefined>;
  /** O gün hangi gemide çalışıldığı (proje adı) */
  projeAdi?: string;
}

type Mod = "giris_cikis" | "tam_yarim" | "ozel_durum";

// ─────────────────────────────────────────────
// Özel Durum Kart Seçici
// ─────────────────────────────────────────────
const RENK_SINIFI: Record<string, { bg: string; border: string; text: string }> = {
  blue:   { bg: "bg-blue-50 dark:bg-blue-950/40",   border: "border-blue-400",   text: "text-blue-700 dark:text-blue-300"   },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-400", text: "text-purple-700 dark:text-purple-300" },
  green:  { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-400", text: "text-emerald-700 dark:text-emerald-300" },
  gray:   { bg: "bg-gray-100 dark:bg-gray-800",      border: "border-gray-400",   text: "text-gray-600 dark:text-gray-400"   },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-400", text: "text-orange-700 dark:text-orange-300" },
  pink:   { bg: "bg-pink-50 dark:bg-pink-950/40",    border: "border-pink-400",   text: "text-pink-700 dark:text-pink-300"   },
  red:    { bg: "bg-red-50 dark:bg-red-950/40",      border: "border-red-400",    text: "text-red-700 dark:text-red-300"    },
};

function OzelDurumSecici({
  secili,
  onSec,
}: {
  secili: OzelDurum | null;
  onSec: (kod: OzelDurum) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {(Object.entries(OZEL_DURUMLAR) as [OzelDurum, typeof OZEL_DURUMLAR[OzelDurum]][]).map(
        ([kod, oz]) => {
          const r = RENK_SINIFI[oz.renk] ?? RENK_SINIFI.gray;
          const aktif = secili === kod;
          return (
            <button
              key={kod}
              type="button"
              onClick={() => onSec(kod)}
              id={`btn-ozel-durum-${kod}`}
              className={[
                "flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 transition-all text-xs font-medium",
                r.bg,
                aktif ? `${r.border} ring-2 ring-offset-1 ring-primary` : "border-transparent hover:border-muted-foreground/30",
                r.text,
              ].join(" ")}
            >
              <span className="text-base font-bold">{oz.kod}</span>
              <span className="text-center leading-tight text-[10px]">{oz.label}</span>
            </button>
          );
        }
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Tam / Yarım Gün Seçici
// ─────────────────────────────────────────────
function TamYarimSecici({
  secili,
  onSec,
}: {
  secili: 8 | 4 | null;
  onSec: (saat: 8 | 4) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Tam Gün */}
      <button
        type="button"
        id="btn-tam-gun"
        onClick={() => onSec(8)}
        className={[
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all",
          secili === 8
            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
            : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50",
        ].join(" ")}
      >
        <Sun className="h-7 w-7" />
        <span className="font-bold text-sm">Tam Gün</span>
        <span className="text-xs text-muted-foreground">8 Saat</span>
      </button>

      {/* Yarım Gün */}
      <button
        type="button"
        id="btn-yarim-gun"
        onClick={() => onSec(4)}
        className={[
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all",
          secili === 4
            ? "border-amber-500 bg-amber-500/10 text-amber-600 ring-2 ring-amber-400/30"
            : "border-border bg-card text-foreground hover:border-amber-400/40 hover:bg-muted/50",
        ].join(" ")}
      >
        <Sunset className="h-7 w-7" />
        <span className="font-bold text-sm">Yarım Gün</span>
        <span className="text-xs text-muted-foreground">4 Saat</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────

/** Mevcut veri bakarak başlangıç modunu belirle */
function baslangicModu(mevcutVeri?: GunVeriGirisiModalProps["mevcutVeri"]): Mod {
  if (mevcutVeri?.ozel_durum) return "ozel_durum";
  if (
    mevcutVeri?.calisma_saati === 8 ||
    mevcutVeri?.calisma_saati === 4
  ) {
    // giris/çıkış saati yoksa tam/yarım modda girilmiş demektir
    if (!mevcutVeri.giris_saati) return "tam_yarim";
  }
  return "giris_cikis";
}

export function GunVeriGirisiModal({
  acik,
  personelId,
  personelAd,
  tarih,
  mevcutVeri,
  yil,
  ay,
  onKapat,
  onKaydetOverride,
  onSilOverride,
  projeAdi,
}: GunVeriGirisiModalProps) {
  const kaydetMutation = useGunVeriGir(yil, ay);
  const silMutation = useGunVeriSil(yil, ay);
  const [isPending, startTransition] = useTransition();

  // Form durumu
  const [mod, setMod] = useState<Mod>(() => baslangicModu(mevcutVeri));
  const [giris, setGiris] = useState(mevcutVeri?.giris_saati ?? "");
  const [cikis, setCikis] = useState(mevcutVeri?.cikis_saati ?? "");
  const [ozelDurum, setOzelDurum] = useState<OzelDurum | null>(
    (mevcutVeri?.ozel_durum as OzelDurum) ?? null
  );
  const [tamYarimSaat, setTamYarimSaat] = useState<8 | 4 | null>(() => {
    if (!mevcutVeri?.giris_saati && mevcutVeri?.calisma_saati === 8) return 8;
    if (!mevcutVeri?.giris_saati && mevcutVeri?.calisma_saati === 4) return 4;
    return null;
  });
  const [aciklama, setAciklama] = useState(mevcutVeri?.aciklama ?? "");
  // Mesai state
  const [mesaiBaslangic, setMesaiBaslangic] = useState("");
  const [mesaiBitis, setMesaiBitis] = useState("");
  const [tamYarimMesai, setTamYarimMesai] = useState<number | null>(null);
  const [ozelMesaiGiris, setOzelMesaiGiris] = useState("");
  // PM (Pazar Mesaisi) özel mesai miktarı (varsayılan 16)
  const [pazarMesaiGiris, setPazarMesaiGiris] = useState("16");

  // Dialog her açıldığında formu mevcut veriyle sıfırla
  useEffect(() => {
    if (acik) {
      setMod(baslangicModu(mevcutVeri));
      setGiris(mevcutVeri?.giris_saati ?? "");
      setCikis(mevcutVeri?.cikis_saati ?? "");
      setOzelDurum((mevcutVeri?.ozel_durum as OzelDurum) ?? null);
      setAciklama(mevcutVeri?.aciklama ?? "");
      // Tam/yarım başlangıç değeri
      if (!mevcutVeri?.giris_saati && mevcutVeri?.calisma_saati === 8) setTamYarimSaat(8);
      else if (!mevcutVeri?.giris_saati && mevcutVeri?.calisma_saati === 4) setTamYarimSaat(4);
      else setTamYarimSaat(null);
      // Mesai: zaman girdişlerini sıfırla
      setMesaiBaslangic("");
      setMesaiBitis("");
      setOzelMesaiGiris("");
      // Tam/yarım modda kaydedilmiş mesai değerini butona veya input'a yansıt
      const kaydedilmisMesai = mevcutVeri?.mesai_saati;
      if (kaydedilmisMesai === 1.5 || kaydedilmisMesai === 3) {
        setTamYarimMesai(kaydedilmisMesai);
        setOzelMesaiGiris("");
      } else if (kaydedilmisMesai != null && kaydedilmisMesai > 0) {
        setTamYarimMesai(null);
        setOzelMesaiGiris(String(kaydedilmisMesai));
      } else {
        setTamYarimMesai(null);
      }
      // PM pazar mesaisi: DB'den oku, yoksa 16
      const pmMesai = mevcutVeri?.mesai_saati;
      setPazarMesaiGiris(
        mevcutVeri?.ozel_durum === "PM" && pmMesai != null ? String(pmMesai) : "16"
      );
    }
  }, [acik, mevcutVeri]);

  const calismaSaati = hesaplaCalismaSaati(giris, cikis);

  // Kayıt var mı? (silme butonu göstermek için)
  const kayitVar = !!(
    mevcutVeri?.giris_saati ||
    mevcutVeri?.ozel_durum ||
    mevcutVeri?.calisma_saati != null
  );

  function handleKaydet() {
    if (mod === "giris_cikis" && !giris) {
      toast.error("Giriş saati zorunludur.");
      return;
    }
    if (mod === "tam_yarim" && !tamYarimSaat) {
      toast.error("Tam veya yarım gün seçin.");
      return;
    }
    if (mod === "ozel_durum" && !ozelDurum) {
      toast.error("Özel durum seçin.");
      return;
    }
    // Mesai: başlangıç girilmişse bitiş de zorunlu
    if (mod !== "ozel_durum" && mesaiBaslangic && !mesaiBitis) {
      toast.error("Mesai bitiş saatini girin.");
      return;
    }

    let veri: PuantajGunVerisi;

    if (mod === "giris_cikis") {
      const yeniMesai = hesaplaMesaiSaatiFn(mesaiBaslangic, mesaiBitis);
      veri = {
        giris_saati: giris || null,
        cikis_saati: cikis || null,
        calisma_saati: calismaSaati,
        ozel_durum: null,
        aciklama: aciklama.trim() || null,
        // Yeni mesai girilmişse onu al, girilmemişse mevcut değeri koru
        mesai_saati: yeniMesai !== null ? yeniMesai : (mevcutVeri?.mesai_saati ?? null),
      };
    } else if (mod === "tam_yarim") {
      // Özel mesai input'u varsa onu kullan, yoksa buton değerini al
      const ozelSaat = ozelMesaiGiris ? parseFloat(ozelMesaiGiris) : null;
      const gecerliOzelSaat = ozelSaat != null && !isNaN(ozelSaat) && ozelSaat > 0 ? ozelSaat : null;
      veri = {
        giris_saati: null,
        cikis_saati: null,
        calisma_saati: tamYarimSaat,
        ozel_durum: null,
        aciklama: aciklama.trim() || null,
        mesai_saati: gecerliOzelSaat ?? tamYarimMesai,
      };
    } else {
      // Özel durum: PM için kullanıcının girdiği mesai saati (varsayılan 16)
      const pmSaat = parseFloat(pazarMesaiGiris);
      const pmMesai = ozelDurum === "PM" && !isNaN(pmSaat) && pmSaat > 0 ? pmSaat : null;
      veri = {
        giris_saati: null,
        cikis_saati: null,
        calisma_saati: null,
        ozel_durum: ozelDurum,
        aciklama: aciklama.trim() || null,
        mesai_saati: pmMesai,
      };
    }

    startTransition(async () => {
      const sonuc = onKaydetOverride
        ? await onKaydetOverride(veri)
        : await kaydetMutation.mutateAsync({ personelId, tarih, veri });
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Kayıt güncellendi.");
      onKapat();
    });
  }

  function handleSil() {
    startTransition(async () => {
      const sonuc = onSilOverride
        ? await onSilOverride()
        : await silMutation.mutateAsync({ personelId, tarih });
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Kayıt silindi.");
      onKapat();
    });
  }

  return (
    <Dialog open={acik} onOpenChange={(v) => !v && onKapat()}>
      <DialogContent className="sm:max-w-md" id="dialog-gun-veri-girisi">
        <DialogHeader>
          <DialogTitle className="text-base">
            <span className="font-bold">{personelAd}</span>
            <span className="text-muted-foreground font-normal mx-2">•</span>
            <span className="text-muted-foreground font-normal text-sm">
              {tarihFormatla(tarih)}
            </span>
          </DialogTitle>
          {/* Proje (gemi) bilgisi */}
          {projeAdi && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium pt-0.5">
              <Ship className="h-3.5 w-3.5 shrink-0" />
              <span>{projeAdi}</span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Mod Seçimi — 3 sekme */}
          <div className="flex rounded-lg border overflow-hidden text-sm font-medium">
            <button
              type="button"
              id="btn-mod-giris-cikis"
              onClick={() => setMod("giris_cikis")}
              className={[
                "flex-1 py-2 transition-colors text-xs",
                mod === "giris_cikis"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              Giriş / Çıkış
            </button>
            <button
              type="button"
              id="btn-mod-tam-yarim"
              onClick={() => setMod("tam_yarim")}
              className={[
                "flex-1 py-2 transition-colors text-xs border-x",
                mod === "tam_yarim"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              Tam / Yarım
            </button>
            <button
              type="button"
              id="btn-mod-ozel-durum"
              onClick={() => setMod("ozel_durum")}
              className={[
                "flex-1 py-2 transition-colors text-xs",
                mod === "ozel_durum"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              Özel Durum
            </button>
          </div>

          {/* Giriş / Çıkış Formu */}
          {mod === "giris_cikis" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="input-giris-saati">
                    Giriş Saati <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="input-giris-saati"
                    type="time"
                    value={giris}
                    onChange={(e) => setGiris(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="input-cikis-saati">Çıkış Saati</Label>
                  <Input
                    id="input-cikis-saati"
                    type="time"
                    value={cikis}
                    onChange={(e) => setCikis(e.target.value)}
                    min={giris}
                  />
                </div>
              </div>

              {calismaSaati !== null && (
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Çalışma Süresi:</span>
                  <span className="font-semibold tabular-nums">
                    {calismaSaati} saat
                  </span>
                </div>
              )}

              {/* Mesai — Giriş/Çıkış tab'ı */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Mesai <span className="font-normal">(Opsiyonel)</span></p>
                  {/* Kayıtlı mesai değeri — yeni giriş yapılmadığında göster */}
                  {mevcutVeri?.mesai_saati != null && !hesaplaMesaiSaatiFn(mesaiBaslangic, mesaiBitis) && (
                    <span className="text-xs rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 font-medium">
                      Kayıtlı: {mevcutVeri.mesai_saati} saat
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="input-mesai-baslangic" className="text-xs">Mesai Başlangıç</Label>
                    <Input
                      id="input-mesai-baslangic"
                      type="time"
                      value={mesaiBaslangic}
                      onChange={(e) => setMesaiBaslangic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="input-mesai-bitis" className="text-xs">Mesai Bitiş</Label>
                    <Input
                      id="input-mesai-bitis"
                      type="time"
                      value={mesaiBitis}
                      onChange={(e) => setMesaiBitis(e.target.value)}
                      min={mesaiBaslangic}
                    />
                  </div>
                </div>
                {hesaplaMesaiSaatiFn(mesaiBaslangic, mesaiBitis) !== null && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm">
                    <span className="text-amber-700 dark:text-amber-400">Yeni Mesai:</span>
                    <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {hesaplaMesaiSaatiFn(mesaiBaslangic, mesaiBitis)} saat
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tam / Yarım Gün */}
          {mod === "tam_yarim" && (
            <div className="space-y-4">
              <TamYarimSecici secili={tamYarimSaat} onSec={setTamYarimSaat} />

              {/* Mesai — Tam/Yarım tab'ı */}
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Mesai <span className="font-normal">(Opsiyonel)</span></p>
                <div className="flex gap-2 flex-wrap">
                  {([1.5, 3] as const).map((saat) => (
                    <button
                      key={saat}
                      type="button"
                      id={`btn-mesai-${String(saat).replace(".", "-")}`}
                      onClick={() => {
                        setTamYarimMesai(tamYarimMesai === saat ? null : saat);
                        setOzelMesaiGiris(""); // özel input'u temizle
                      }}
                      className={[
                        "rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all",
                        tamYarimMesai === saat && !ozelMesaiGiris
                          ? "border-amber-500 bg-amber-500/10 text-amber-600 ring-2 ring-amber-400/30"
                          : "border-border bg-card text-foreground hover:border-amber-400/40 hover:bg-muted/50",
                      ].join(" ")}
                    >
                      {saat} Saat
                    </button>
                  ))}

                  {/* Özel saat girişi */}
                  <div className="flex items-center gap-1.5">
                    <Input
                      id="input-mesai-ozel"
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      placeholder="Özel…"
                      value={ozelMesaiGiris}
                      onChange={(e) => {
                        setOzelMesaiGiris(e.target.value);
                        if (e.target.value) setTamYarimMesai(null); // butonu deselect et
                      }}
                      className={[
                        "h-9 w-24 text-sm text-center tabular-nums",
                        ozelMesaiGiris ? "border-amber-500 ring-2 ring-amber-400/30" : "",
                      ].join(" ")}
                    />
                    <span className="text-xs text-muted-foreground">saat</span>
                  </div>

                  {(tamYarimMesai !== null || ozelMesaiGiris) && (
                    <button
                      type="button"
                      id="btn-mesai-sifirla"
                      onClick={() => { setTamYarimMesai(null); setOzelMesaiGiris(""); }}
                      className="px-3 rounded-lg border-2 border-border bg-card text-xs text-muted-foreground hover:bg-muted transition-all self-stretch"
                    >
                      Yok
                    </button>
                  )}
                </div>

                {/* Seçilen mesai özeti */}
                {(tamYarimMesai !== null || (ozelMesaiGiris && parseFloat(ozelMesaiGiris) > 0)) && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm">
                    <span className="text-amber-700 dark:text-amber-400">Mesai:</span>
                    <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {ozelMesaiGiris ? parseFloat(ozelMesaiGiris) : tamYarimMesai} saat
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Özel Durum Seçici */}
          {mod === "ozel_durum" && (
            <div className="space-y-3">
              <OzelDurumSecici secili={ozelDurum} onSec={setOzelDurum} />

              {/* PM (Pazar Mesaisi) seçilince özel mesai miktarı */}
              {ozelDurum === "PM" && (
                <div className="flex items-center gap-3 rounded-lg border border-pink-200 bg-pink-50 dark:bg-pink-950/30 dark:border-pink-800 px-3 py-2.5">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-pink-700 dark:text-pink-300 mb-1">
                      Pazar Mesaisi Saati
                    </p>
                    <p className="text-[10px] text-pink-500 dark:text-pink-400">
                      Varsayılan 16 saat — istediğiniz değeri girin
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      id="input-pazar-mesai"
                      type="number"
                      min="0.5"
                      max="48"
                      step="0.5"
                      value={pazarMesaiGiris}
                      onChange={(e) => setPazarMesaiGiris(e.target.value)}
                      className="h-9 w-20 text-sm text-center tabular-nums border-pink-300 focus:border-pink-500"
                    />
                    <span className="text-xs text-pink-600 dark:text-pink-400 font-medium">saat</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Açıklama */}
          <div className="space-y-1.5">
            <Label htmlFor="input-aciklama">Açıklama</Label>
            <Textarea
              id="input-aciklama"
              placeholder="Opsiyonel not…"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              rows={2}
              maxLength={200}
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {aciklama.length}/200
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          {/* Sol: Sil butonu */}
          <div className="flex-1">
            {kayitVar && (
              <Button
                variant="destructive"
                size="sm"
                id="btn-kayit-sil"
                onClick={handleSil}
                disabled={isPending}
                className="gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Kaydı Temizle
              </Button>
            )}
          </div>

          {/* Sağ: İptal / Kaydet */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              id="btn-modal-iptal"
              onClick={onKapat}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button
              id="btn-modal-kaydet"
              onClick={handleKaydet}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
