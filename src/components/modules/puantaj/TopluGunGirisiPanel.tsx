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

  const mutation = useTopluGunGirisi(yil, ay);

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
    // Tüm hafta içi zaten seçiliyse temizle
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

    const veri: PuantajGunVerisi =
      mod === "ozel"
        ? { ozel_durum: ozel_durum as OzelDurum }
        : {
            calisma_saati: parseFloat(calisma_saati),
            giris_saati: giris_saati || null,
            cikis_saati: cikis_saati || null,
          };

    const kayitlar: { personelId: string; tarih: string; veri: PuantajGunVerisi }[] = [];
    for (const personelId of seciliPersoneller) {
      for (const tarih of seciliGunler) {
        kayitlar.push({ personelId, tarih, veri });
      }
    }

    const sonuc = await mutation.mutateAsync(kayitlar);

    if (sonuc?.hata) {
      toast.error(sonuc.hata);
      return;
    }

    const { eklenenSayisi = 0, atlananSayisi = 0 } = sonuc as {
      eklenenSayisi?: number;
      atlananSayisi?: number;
    };

    if (atlananSayisi > 0) {
      toast.warning(
        `${eklenenSayisi} kayıt eklendi, ${atlananSayisi} kilitli gün atlandı.`
      );
    } else {
      toast.success(`${eklenenSayisi} kayıt başarıyla girildi.`);
    }

    // Seçimleri sıfırla
    setSeciliPersoneller(new Set());
    setSeciliGunler(new Set());
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
            </div>
          ) : (
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
