"use client";

import { use, useState, useEffect, useTransition, useCallback } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = any;
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Loader2, Save, Anchor, Building2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  belgeEkle, belgeGuncelle, belgeDetayGetir,
  firmaListesiGetir, sonrakiBelgeNoGetir,
} from "@/app/actions/cari";
import { hesaplaToplam, hesaplaGenelToplam, belgeNoOner, paraFormat } from "@/lib/cari";
import { useInvalidateCari } from "@/hooks/useCari";
import type { BelgeKalem, BelgeTur, ParaBirimi } from "@/types";

// ─────────────────────────────────────────────
// Boş kalem
// ─────────────────────────────────────────────
function bosKalem(): BelgeKalem {
  return {
    id: uuidv4(),
    aciklama: "",
    miktar: 1,
    birim: "adet",
    birim_fiyat: 0,
    iskonto: 0,
  };
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
type Props =
  | { mod: "yeni"; searchParamsPromise: Promise<{ gemiId?: string; firmaId?: string; tur?: string }> }
  | { mod: "duzenle"; belgeIdPromise: Promise<{ belgeId: string }> };

export function BelgeFormView(props: Props) {
  const router = useRouter();
  const {
    invalidateBelgeList, invalidateKpi, invalidateGenel, invalidateTumBelgeList,
  } = useInvalidateCari();

  // ─── State ───
  const [tur, setTur] = useState<BelgeTur>("proforma");
  // Gemi: her zaman tek seferlik metin
  const [tekGemiAdi, setTekGemiAdi] = useState("");
  // Firma: listeden ya da tek seferlik
  const [firmaId, setFirmaId] = useState<string>("");
  const [tekSeferlikFirma, setTekSeferlikFirma] = useState(false);
  const [tekFirmaAdi, setTekFirmaAdi] = useState("");
  const [belgeNo, setBelgeNo] = useState("");
  const [tarih, setTarih] = useState(new Date().toISOString().split("T")[0]);
  const [pb, setPb] = useState<ParaBirimi>("USD");
  const [iskonto, setIskonto] = useState(0);
  const [kdv, setKdv] = useState<number | "">("");
  const [notlar, setNotlar] = useState("");
  const [kalemler, setKalemler] = useState<BelgeKalem[]>([bosKalem()]);

  // ─── Data ───
  const [firmalar, setFirmalar] = useState<{ id: string; ad: string }[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Params
  const firmaIdParam =
    props.mod === "yeni"
      ? (use(props.searchParamsPromise).firmaId ?? "")
      : "";
  const turParam =
    props.mod === "yeni"
      ? (use(props.searchParamsPromise).tur ?? "proforma")
      : "proforma";
  const belgeIdFromParams =
    props.mod === "duzenle"
      ? use(props.belgeIdPromise).belgeId
      : null;

  // ─── Init ───
  useEffect(() => {
    async function init() {
      setYukleniyor(true);
      try {
        const [firmaListesi, sira] = await Promise.all([
          firmaListesiGetir(),
          sonrakiBelgeNoGetir(tur),
        ]);
        setFirmalar(firmaListesi.map((f: AnyObj) => ({ id: f.id, ad: f.ad })));

        if (props.mod === "yeni") {
          const basTur = (turParam as BelgeTur) || "proforma";
          setTur(basTur);
          setBelgeNo(belgeNoOner(basTur, sira));
          if (firmaIdParam) setFirmaId(firmaIdParam);
        } else if (belgeIdFromParams) {
          const belge: AnyObj = await belgeDetayGetir(belgeIdFromParams);
          setTur(belge.tur);
          // Gemi adı
          if (belge.tek_gemi_adi) setTekGemiAdi(belge.tek_gemi_adi);
          // Firma
          if (belge.firma_id) {
            setFirmaId(belge.firma_id);
          } else if (belge.tek_firma_adi) {
            setTekSeferlikFirma(true);
            setTekFirmaAdi(belge.tek_firma_adi);
          }
          setBelgeNo(belge.belge_no);
          setTarih(belge.tarih);
          setPb(belge.para_birimi);
          setIskonto(Number(belge.iskonto ?? 0));
          setKdv(belge.kdv_orani ?? "");
          setNotlar(belge.notlar ?? "");
          const kalemlerRaw = Array.isArray(belge.kalemler) ? belge.kalemler : [];
          setKalemler(
            kalemlerRaw.length
              ? kalemlerRaw.map((k: Omit<BelgeKalem, "id">) => ({ ...k, id: uuidv4() }))
              : [bosKalem()]
          );
        }
      } catch {
        toast.error("Veriler yüklenemedi.");
      } finally {
        setYukleniyor(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // ─── Kalem işlemleri ───
  const kalemGuncelle = useCallback(
    (id: string, field: keyof BelgeKalem, val: string | number) => {
      setKalemler((prev) =>
        prev.map((k) => (k.id === id ? { ...k, [field]: val } : k))
      );
    },
    []
  );

  const kalemSil = useCallback((id: string) => {
    setKalemler((prev) => (prev.length > 1 ? prev.filter((k) => k.id !== id) : prev));
  }, []);

  const araToplam = hesaplaToplam(kalemler);
  const matrah = Math.max(0, araToplam - iskonto);
  const kdvTutarVal = kdv !== "" && Number(kdv) > 0 ? Math.round(matrah * (Number(kdv) / 100) * 100) / 100 : 0;
  const genelToplam = hesaplaGenelToplam(araToplam, iskonto, kdv !== "" ? Number(kdv) : null);

  // ─── Submit ───
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // En az biri dolu olmalı
    const firmaVal = tekSeferlikFirma ? tekFirmaAdi.trim() : firmaId;
    if (!tekGemiAdi.trim() && !firmaVal) {
      toast.error("Gemi adı veya firma seçimi zorunludur — en az biri girilmeli.");
      return;
    }
    if (tekSeferlikFirma && !tekFirmaAdi.trim()) {
      toast.error("Tek seferlik firma adı zorunludur.");
      return;
    }
    if (!belgeNo.trim()) { toast.error("Belge numarası zorunludur."); return; }
    if (kalemler.some((k) => !k.aciklama.trim())) {
      toast.error("Tüm kalemlerin açıklaması doldurulmalıdır.");
      return;
    }

    startTransition(async () => {
      const payload = {
        gemi_id: null,
        firma_id: !tekSeferlikFirma ? (firmaId || null) : null,
        tek_gemi_adi: tekGemiAdi.trim() || null,
        tek_firma_adi: tekSeferlikFirma ? tekFirmaAdi.trim() : null,
        tur,
        belge_no: belgeNo,
        tarih,
        para_birimi: pb,
        kalemler,
        iskonto,
        kdv_orani: kdv !== "" ? Number(kdv) : null,
        ilgili_kisi_id: null,
        notlar: notlar || null,
      };

      let res;
      if (props.mod === "yeni") {
        res = await belgeEkle(payload);
      } else {
        res = await belgeGuncelle(belgeIdFromParams!, payload);
      }

      if (res?.hata) { toast.error(res.hata); return; }

      toast.success(props.mod === "yeni" ? "Belge oluşturuldu." : "Belge güncellendi.");
      invalidateTumBelgeList();
      invalidateKpi();
      invalidateGenel();
      // gemi artık tek seferlik — belge listesi cache temizliği yeterli
      router.push("/cari");
    });
  }

  if (yukleniyor) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Geri
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {props.mod === "yeni" ? "Yeni Belge" : "Belge Düzenle"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Proforma veya fatura oluşturun.
          </p>
        </div>
      </div>

      {/* Belge Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Belge Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tür */}
          <div className="space-y-1.5">
            <Label>Belge Türü *</Label>
            <Select
              value={tur}
              onValueChange={async (v) => {
                if (!v) return;
                const t = v as BelgeTur;
                setTur(t);
                const sira = await sonrakiBelgeNoGetir(t);
                setBelgeNo(belgeNoOner(t, sira));
              }}
            >
              <SelectTrigger id="belge-tur"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="proforma">Proforma</SelectItem>
                <SelectItem value="fatura">Fatura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Belge No */}
          <div className="space-y-1.5">
            <Label htmlFor="belge-no">Belge No *</Label>
            <Input
              id="belge-no"
              value={belgeNo}
              onChange={(e) => setBelgeNo(e.target.value)}
              className="font-mono"
              required
            />
          </div>

          {/* Tarih */}
          <div className="space-y-1.5">
            <Label htmlFor="belge-tarih">Tarih *</Label>
            <Input
              id="belge-tarih"
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              required
            />
          </div>

          {/* Para Birimi */}
          <div className="space-y-1.5">
            <Label>Para Birimi</Label>
            <Select value={pb} onValueChange={(v) => { if (v) setPb(v as ParaBirimi); }}>
              <SelectTrigger id="belge-pb"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY ₺</SelectItem>
                <SelectItem value="EUR">EUR €</SelectItem>
                <SelectItem value="USD">USD $</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gemi Adı + Firma — ikisi aynı anda girilebilir */}
          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gemi Adı */}
            <div className="space-y-1.5">
              <Label htmlFor="tek-gemi-adi">
                <Anchor className="inline h-3.5 w-3.5 mr-1 opacity-70" />
                Gemi Adı
                <span className="text-muted-foreground text-xs ml-1">(opsiyonel)</span>
              </Label>
              <Input
                id="tek-gemi-adi"
                value={tekGemiAdi}
                onChange={(e) => setTekGemiAdi(e.target.value)}
                placeholder="ör. M/V Pacific Star"
                className="font-medium"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Sisteme kayıt açılmaz; sadece belge üzerinde görünür.
              </p>
            </div>

            {/* Firma */}
            <div className="space-y-2">
              <Label>
                <Building2 className="inline h-3.5 w-3.5 mr-1 opacity-70" />
                Firma
                <span className="text-muted-foreground text-xs ml-1">(opsiyonel)</span>
              </Label>
              <div className="flex gap-1 rounded-lg border p-0.5 bg-muted/40 w-fit">
                <button
                  type="button"
                  onClick={() => { setTekSeferlikFirma(false); setTekFirmaAdi(""); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    !tekSeferlikFirma
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Listeden Seç
                </button>
                <button
                  type="button"
                  onClick={() => { setTekSeferlikFirma(true); setFirmaId(""); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    tekSeferlikFirma
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tek Seferlik
                </button>
              </div>
              {tekSeferlikFirma ? (
                <div className="space-y-1.5">
                  <Input
                    id="tek-firma-adi"
                    value={tekFirmaAdi}
                    onChange={(e) => setTekFirmaAdi(e.target.value)}
                    placeholder="ör. XYZ Denizcilik Ltd."
                    className="font-medium"
                  />
                  <p className="text-xs text-muted-foreground">Sisteme kayıt oluşturulmaz.</p>
                </div>
              ) : (
                <Select value={firmaId} onValueChange={(v) => setFirmaId(v ?? "")}>
                  <SelectTrigger id="belge-firma">
                    <SelectValue placeholder="Firma seçin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Seçilmedi —</SelectItem>
                    {firmalar.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.ad}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kalem Tablosu */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Kalemler</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            id="btn-kalem-ekle"
            onClick={() => setKalemler((prev) => [...prev, bosKalem()])}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Kalem Ekle
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Açıklama</TableHead>
                  <TableHead className="w-24">Miktar</TableHead>
                  <TableHead className="w-24">Birim</TableHead>
                  <TableHead className="w-32">Birim Fiyat</TableHead>
                  <TableHead className="w-28">İskonto</TableHead>
                  <TableHead className="w-32 text-right">Satır Toplam</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {kalemler.map((k) => {
                  const satirToplam = Math.max(0, k.miktar * k.birim_fiyat - k.iskonto);
                  return (
                    <TableRow key={k.id}>
                      <TableCell>
                        <Input
                          value={k.aciklama}
                          onChange={(e) => kalemGuncelle(k.id, "aciklama", e.target.value)}
                          placeholder="Hizmet / ürün açıklaması"
                          className="border-0 bg-transparent focus-visible:ring-1 px-1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number" min="0" step="1" value={k.miktar}
                          onChange={(e) => kalemGuncelle(k.id, "miktar", Number(e.target.value))}
                          className="border-0 bg-transparent focus-visible:ring-1 px-1 font-mono text-sm text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={k.birim}
                          onChange={(e) => kalemGuncelle(k.id, "birim", e.target.value)}
                          placeholder="adet"
                          className="border-0 bg-transparent focus-visible:ring-1 px-1 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number" min="0" step="0.01" value={k.birim_fiyat}
                          onChange={(e) => kalemGuncelle(k.id, "birim_fiyat", Number(e.target.value))}
                          className="border-0 bg-transparent focus-visible:ring-1 px-1 font-mono text-sm text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number" min="0" step="0.01" value={k.iskonto}
                          onChange={(e) => kalemGuncelle(k.id, "iskonto", Number(e.target.value))}
                          className="border-0 bg-transparent focus-visible:ring-1 px-1 font-mono text-sm text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-sm">
                        {paraFormat(satirToplam, pb)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => kalemSil(k.id)}
                          disabled={kalemler.length === 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Özet + Notlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="belge-notlar">Notlar</Label>
          <Textarea
            id="belge-notlar"
            value={notlar}
            onChange={(e) => setNotlar(e.target.value)}
            rows={4}
            placeholder="Belgeye eklemek istediğiniz notlar..."
          />
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ara Toplam</span>
              <span className="font-mono">{paraFormat(araToplam, pb)}</span>
            </div>
            <div className="flex items-center justify-between text-sm gap-4">
              <span className="text-muted-foreground shrink-0">Belge İskontosu</span>
              <Input
                type="number" min="0" step="0.01" value={iskonto}
                onChange={(e) => setIskonto(Number(e.target.value))}
                className="w-32 font-mono text-sm text-right h-8"
                id="belge-iskonto"
              />
            </div>
            <div className="flex items-center justify-between text-sm gap-4">
              <span className="text-muted-foreground shrink-0">KDV (%)</span>
              <Input
                type="number" min="0" max="100" step="1" value={kdv}
                onChange={(e) => setKdv(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Opsiyonel"
                className="w-32 font-mono text-sm text-right h-8"
                id="belge-kdv"
              />
            </div>
            <Separator />
            {kdv !== "" && Number(kdv) > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Matrah</span>
                  <span className="font-mono">{paraFormat(matrah, pb)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">KDV (%{kdv})</span>
                  <span className="font-mono text-amber-600">{paraFormat(kdvTutarVal, pb)}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Genel Toplam {kdv !== "" && Number(kdv) > 0 ? "(KDV Dahil)" : ""}</span>
              <span className="font-mono text-lg">{paraFormat(genelToplam, pb)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kaydet */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          İptal
        </Button>
        <Button type="submit" disabled={isPending} id="btn-belge-kaydet">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {props.mod === "yeni" ? "Belge Oluştur" : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </form>
  );
}
