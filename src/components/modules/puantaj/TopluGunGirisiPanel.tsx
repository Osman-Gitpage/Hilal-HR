"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  CheckSquare,
  Square,
  CheckCheck,
  X,
  Loader2,
  Users,
  CalendarDays,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTopluGunGirisi } from "@/hooks/usePuantaj";
import { OZEL_DURUMLAR } from "@/lib/constants";
import type { OzelDurum, PuantajGunVerisi } from "@/types";

// ─────────────────────────────────────────────
// Tipler
// ─────────────────────────────────────────────
interface PersonelSatir {
  id: string;
  ad: string;
  soyad: string;
  gorev_unvan: string | null;
}

interface GunBilgi {
  gun: number;
  tarihStr: string;
  pazar: boolean;
}

interface Props {
  yil: number;
  ay: number;
  personeller: PersonelSatir[];
  gunler: GunBilgi[];
  ayKapali: boolean;
  onKapat: () => void;
  /** Opsiyonel: tanımlanırsa iç mutation yerine bu çağrılır (proje puantaj için) */
  onUygula?: (
    kayitlar: { personelId: string; tarih: string; veri: PuantajGunVerisi }[]
  ) => Promise<{ hata?: string; eklenenSayisi?: number; atlananSayisi?: number }>;
}

// ─────────────────────────────────────────────
// Yardımcı: mesai saati hesapla
// ─────────────────────────────────────────────
function hesaplaMesai(baslangic: string, bitis: string): number | null {
  if (!baslangic || !bitis) return null;
  const [bh, bm] = baslangic.split(":").map(Number);
  const [eh, em] = bitis.split(":").map(Number);
  const dakika = eh * 60 + em - (bh * 60 + bm);
  if (dakika <= 0) return null;
  return Math.round((dakika / 60) * 100) / 100;
}

// ─────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────
export function TopluGunGirisiPanel({
  yil,
  ay,
  personeller,
  gunler,
  ayKapali,
  onKapat,
  onUygula,
}: Props) {
  // Seçimler
  const [seciliPersoneller, setSeciliPersoneller] = useState<Set<string>>(new Set());
  const [seciliGunler, setSeciliGunler] = useState<Set<string>>(new Set());

  // Giriş formu
  const [mod, setMod] = useState<"saat" | "ozel">("saat");
  const [calisma_saati, setCalismaSaati] = useState<string>("8");
  const [giris_saati, setGirisSaati] = useState<string>("");
  const [cikis_saati, setCikisSaati] = useState<string>("");
  const [ozel_durum, setOzelDurum] = useState<OzelDurum | "">("");

  // ── Mesai ──
  const [mesaiBaslangic, setMesaiBaslangic] = useState("");
  const [mesaiBitis, setMesaiBitis] = useState("");
  const [tamYarimMesai, setTamYarimMesai] = useState<number | null>(null);
  const [ozelMesaiGiris, setOzelMesaiGiris] = useState("");
  // PM özel mesai miktarı (varsayılan 16)
  const [pazarMesaiGiris, setPazarMesaiGiris] = useState("16");

  const mutation = useTopluGunGirisi(yil, ay);

  // Hesaplanan mesai (saat modunda)
  const hesaplananMesai = hesaplaMesai(mesaiBaslangic, mesaiBitis);

  // ── Personel toggle ──
  function togglePersonel(id: string) {
    setSeciliPersoneller((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function tumPersonelSec() {
    if (seciliPersoneller.size === personeller.length) {
      setSeciliPersoneller(new Set());
    } else {
      setSeciliPersoneller(new Set(personeller.map((p) => p.id)));
    }
  }

  // ── Gün toggle ──
  function toggleGun(tarih: string) {
    setSeciliGunler((prev) => {
      const next = new Set(prev);
      if (next.has(tarih)) next.delete(tarih);
      else next.add(tarih);
      return next;
    });
  }
  function tumHaftaIciSec() {
    const hafataIci = gunler.filter((g) => !g.pazar).map((g) => g.tarihStr);
    const tumSecili = hafataIci.every((t) => seciliGunler.has(t));
    if (tumSecili) {
      setSeciliGunler((prev) => {
        const next = new Set(prev);
        hafataIci.forEach((t) => next.delete(t));
        return next;
      });
    } else {
      setSeciliGunler((prev) => {
        const next = new Set(prev);
        hafataIci.forEach((t) => next.add(t));
        return next;
      });
    }
  }

  // ── Özet ──
  const seciliPersonelSayisi = seciliPersoneller.size;
  const seciliGunSayisi = seciliGunler.size;
  const toplamKayitSayisi = seciliPersonelSayisi * seciliGunSayisi;

  // ── Doğrulama ──
  const formGecerli = useMemo(() => {
    if (mod === "saat") {
      const saat = parseFloat(calisma_saati);
      return !isNaN(saat) && saat > 0 && saat <= 24;
    }
    return ozel_durum !== "";
  }, [mod, calisma_saati, ozel_durum]);

  const uygulanabilir =
    seciliPersonelSayisi > 0 &&
    seciliGunSayisi > 0 &&
    formGecerli &&
    !ayKapali;

  // ── Uygula ──
  async function handleUygula() {
    if (!uygulanabilir) return;

    // Mesai hesapla
    let mesaiSaati: number | null = null;

    if (mod === "saat") {
      if (hesaplananMesai !== null) {
        mesaiSaati = hesaplananMesai;
      } else if (ozelMesaiGiris) {
        const ozel = parseFloat(ozelMesaiGiris);
        mesaiSaati = !isNaN(ozel) && ozel > 0 ? ozel : null;
      } else if (tamYarimMesai !== null) {
        mesaiSaati = tamYarimMesai;
      }
    }

    const veri: PuantajGunVerisi =
      mod === "ozel"
        ? {
            ozel_durum: ozel_durum as OzelDurum,
            mesai_saati:
              ozel_durum === "PM"
                ? (() => {
                    const pm = parseFloat(pazarMesaiGiris);
                    return !isNaN(pm) && pm > 0 ? pm : null;
                  })()
                : null,
          }
        : {
            calisma_saati: parseFloat(calisma_saati),
            giris_saati: giris_saati || null,
            cikis_saati: cikis_saati || null,
            mesai_saati: mesaiSaati,
          };

    const kayitlar: { personelId: string; tarih: string; veri: PuantajGunVerisi }[] = [];
    for (const personelId of seciliPersoneller) {
      for (const tarih of seciliGunler) {
        kayitlar.push({ personelId, tarih, veri });
      }
    }

    // onUygula prop'u varsa onu kullan (proje puantaj), yoksa iç mutation
    let sonuc: { hata?: string; eklenenSayisi?: number; atlananSayisi?: number };
    if (onUygula) {
      sonuc = await onUygula(kayitlar);
    } else {
      sonuc = await mutation.mutateAsync(kayitlar) as typeof sonuc;
    }

    if (sonuc?.hata) {
      toast.error(sonuc.hata);
      return;
    }

    const { eklenenSayisi = 0, atlananSayisi = 0 } = sonuc;

    if (atlananSayisi > 0) {
      toast.warning(`${eklenenSayisi} kayıt eklendi, ${atlananSayisi} kilitli gün atlandı.`);
    } else {
      toast.success(`${eklenenSayisi} kayıt başarıyla girildi.`);
    }

    setSeciliPersoneller(new Set());
    setSeciliGunler(new Set());
    // Mesai sıfırla
    setMesaiBaslangic("");
    setMesaiBitis("");
    setTamYarimMesai(null);
    setOzelMesaiGiris("");
    setPazarMesaiGiris("16");
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm space-y-4 p-4">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCheck className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Toplu Gün Girişi</span>
          {toplamKayitSayisi > 0 && (
            <Badge variant="secondary" className="text-xs">
              {toplamKayitSayisi} hücre seçili
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onKapat}
          className="h-7 w-7"
          id="btn-toplu-giris-kapat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Sol: Personel Seçimi ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Personel
            </Label>
            <button
              type="button"
              onClick={tumPersonelSec}
              className="text-[11px] text-primary hover:underline"
            >
              {seciliPersoneller.size === personeller.length
                ? "Tümünü kaldır"
                : "Tümünü seç"}
            </button>
          </div>
          <div className="border rounded-lg max-h-52 overflow-y-auto divide-y">
            {personeller.map((p) => {
              const secili = seciliPersoneller.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePersonel(p.id)}
                  className={[
                    "w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                    secili
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50",
                  ].join(" ")}
                >
                  {secili ? (
                    <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Square className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    {p.ad} {p.soyad}
                  </span>
                  {p.gorev_unvan && (
                    <span className="text-muted-foreground text-[10px] ml-auto truncate max-w-[80px]">
                      {p.gorev_unvan}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {seciliPersonelSayisi} / {personeller.length} personel seçili
          </p>
        </div>

        {/* ── Orta: Gün Seçimi ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Günler
            </Label>
            <button
              type="button"
              onClick={tumHaftaIciSec}
              className="text-[11px] text-primary hover:underline"
            >
              Hafta içi
            </button>
          </div>
          <div className="border rounded-lg max-h-52 overflow-y-auto">
            <div className="grid grid-cols-5 gap-px p-1.5">
              {gunler.map(({ gun, tarihStr, pazar }) => {
                const secili = seciliGunler.has(tarihStr);
                return (
                  <button
                    key={tarihStr}
                    type="button"
                    onClick={() => toggleGun(tarihStr)}
                    className={[
                      "rounded text-[11px] font-medium h-7 transition-colors",
                      pazar ? "text-rose-500" : "",
                      secili
                        ? "bg-primary text-primary-foreground"
                        : pazar
                          ? "bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100"
                          : "hover:bg-muted",
                    ].join(" ")}
                  >
                    {gun}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {seciliGunSayisi} gün seçili
          </p>
        </div>

        {/* ── Sağ: Değer Girişi ── */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold">Girilecek Değer</Label>

          {/* Mod Seçimi */}
          <div className="flex rounded-lg border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setMod("saat")}
              className={[
                "flex-1 py-1.5 transition-colors font-medium",
                mod === "saat"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              ].join(" ")}
            >
              Çalışma Saati
            </button>
            <button
              type="button"
              onClick={() => setMod("ozel")}
              className={[
                "flex-1 py-1.5 transition-colors font-medium",
                mod === "ozel"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              ].join(" ")}
            >
              Özel Durum
            </button>
          </div>

          {/* ── Çalışma Saati Modu ── */}
          {mod === "saat" ? (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Çalışma Saati
                </Label>
                <Input
                  id="input-toplu-calisma-saati"
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={calisma_saati}
                  onChange={(e) => setCalismaSaati(e.target.value)}
                  placeholder="8"
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Giriş (opsiyonel)
                  </Label>
                  <Input
                    id="input-toplu-giris-saati"
                    type="time"
                    value={giris_saati}
                    onChange={(e) => setGirisSaati(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Çıkış (opsiyonel)
                  </Label>
                  <Input
                    id="input-toplu-cikis-saati"
                    type="time"
                    value={cikis_saati}
                    onChange={(e) => setCikisSaati(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* ── Mesai Bölümü ── */}
              <div className="border-t pt-2 space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Mesai <span className="font-normal">(Opsiyonel)</span>
                </p>

                {/* Hızlı butonlar */}
                <div className="flex gap-1.5 flex-wrap items-center">
                  {([1.5, 3] as const).map((saat) => (
                    <button
                      key={saat}
                      type="button"
                      id={`btn-toplu-mesai-${String(saat).replace(".", "-")}`}
                      onClick={() => {
                        setTamYarimMesai(tamYarimMesai === saat ? null : saat);
                        setOzelMesaiGiris("");
                        setMesaiBaslangic("");
                        setMesaiBitis("");
                      }}
                      className={[
                        "rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-all",
                        tamYarimMesai === saat && !ozelMesaiGiris && !hesaplananMesai
                          ? "border-amber-500 bg-amber-500/10 text-amber-600 ring-1 ring-amber-400/30"
                          : "border-border bg-card text-foreground hover:border-amber-400/40 hover:bg-muted/50",
                      ].join(" ")}
                    >
                      {saat} saat
                    </button>
                  ))}

                  {/* Özel saat girişi */}
                  <Input
                    id="input-toplu-mesai-ozel"
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    placeholder="Özel…"
                    value={ozelMesaiGiris}
                    onChange={(e) => {
                      setOzelMesaiGiris(e.target.value);
                      if (e.target.value) {
                        setTamYarimMesai(null);
                        setMesaiBaslangic("");
                        setMesaiBitis("");
                      }
                    }}
                    className={[
                      "h-7 w-20 text-xs text-center tabular-nums",
                      ozelMesaiGiris ? "border-amber-500 ring-1 ring-amber-400/30" : "",
                    ].join(" ")}
                  />
                  <span className="text-[10px] text-muted-foreground">saat</span>
                </div>

                {/* Saat aralığı girişi */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Başlangıç</Label>
                    <Input
                      id="input-toplu-mesai-baslangic"
                      type="time"
                      value={mesaiBaslangic}
                      onChange={(e) => {
                        setMesaiBaslangic(e.target.value);
                        if (e.target.value) {
                          setTamYarimMesai(null);
                          setOzelMesaiGiris("");
                        }
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Bitiş</Label>
                    <Input
                      id="input-toplu-mesai-bitis"
                      type="time"
                      value={mesaiBitis}
                      onChange={(e) => {
                        setMesaiBitis(e.target.value);
                        if (e.target.value) {
                          setTamYarimMesai(null);
                          setOzelMesaiGiris("");
                        }
                      }}
                      min={mesaiBaslangic}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>

                {/* Hesaplanan mesai özeti */}
                {(hesaplananMesai !== null ||
                  tamYarimMesai !== null ||
                  (ozelMesaiGiris && parseFloat(ozelMesaiGiris) > 0)) && (
                  <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 text-xs">
                    <span className="text-amber-700 dark:text-amber-400">Mesai:</span>
                    <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {hesaplananMesai !== null
                        ? hesaplananMesai
                        : ozelMesaiGiris
                          ? parseFloat(ozelMesaiGiris)
                          : tamYarimMesai}{" "}
                      saat
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Özel Durum Modu ── */
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Durum
                </Label>
                <Select
                  value={ozel_durum}
                  onValueChange={(v) => setOzelDurum(v as OzelDurum)}
                >
                  <SelectTrigger
                    id="select-toplu-ozel-durum"
                    className="h-8 text-xs"
                  >
                    <SelectValue placeholder="Durum seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OZEL_DURUMLAR).map(([key, oz]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        <span className="font-bold mr-2">{oz.kod}</span>
                        {oz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PM seçilince pazar mesaisi */}
              {ozel_durum === "PM" && (
                <div className="flex items-center gap-3 rounded-lg border border-pink-200 bg-pink-50 dark:bg-pink-950/30 dark:border-pink-800 px-3 py-2">
                  <div className="flex-1">
                    <p className="text-[11px] font-medium text-pink-700 dark:text-pink-300 mb-0.5">
                      Pazar Mesaisi Saati
                    </p>
                    <p className="text-[10px] text-pink-500 dark:text-pink-400">
                      Varsayılan 16 saat
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      id="input-toplu-pazar-mesai"
                      type="number"
                      min="0.5"
                      max="48"
                      step="0.5"
                      value={pazarMesaiGiris}
                      onChange={(e) => setPazarMesaiGiris(e.target.value)}
                      className="h-8 w-16 text-xs text-center tabular-nums border-pink-300 focus:border-pink-500"
                    />
                    <span className="text-[11px] text-pink-600 dark:text-pink-400 font-medium">saat</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Özet + Uygula */}
          <div className="space-y-2">
            {toplamKayitSayisi > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {seciliPersonelSayisi} personel × {seciliGunSayisi} gün ={" "}
                <strong>{toplamKayitSayisi} hücre</strong> güncellenecek
              </p>
            )}
            {ayKapali && (
              <p className="text-[11px] text-destructive">
                ⚠ Bu ay kilitli — toplu giriş yapılamaz.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                id="btn-toplu-uygula"
                size="sm"
                disabled={!uygulanabilir || mutation.isPending}
                onClick={handleUygula}
                className="flex-1 gap-1.5"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                {mutation.isPending ? "Uygulanıyor..." : "Uygula"}
              </Button>
              <Button
                id="btn-toplu-sifirla"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSeciliPersoneller(new Set());
                  setSeciliGunler(new Set());
                  setMesaiBaslangic("");
                  setMesaiBitis("");
                  setTamYarimMesai(null);
                  setOzelMesaiGiris("");
                  setPazarMesaiGiris("16");
                }}
                disabled={toplamKayitSayisi === 0}
              >
                Sıfırla
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
