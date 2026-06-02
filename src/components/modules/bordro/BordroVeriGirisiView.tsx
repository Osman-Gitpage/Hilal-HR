"use client";

/**
 * Bordro Veri Girişi — Ana View
 *
 * T4.5 değişiklikleri:
 *   - stripIds / EkKalemEditor import'u kaldırıldı
 *   - sirket_id: "" kaldırıldı (server tarafı hallediyor)
 *   - Tooltip render prop → asChild pattern
 *   - ekKalemKaydet action entegre edildi (bordro kaydı sonrası ek kalemler ayrıca kaydedilir)
 *   - handleEkOdemelerChange / handleEkKesintilerChange kaldırıldı (dispatch doğrudan tab'a geçiliyor)
 *   - useInvalidateBordro → personelId parametresi ile çağrılıyor
 */

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Modül bileşenleri ──
import { DonemSecici } from "@/components/modules/bordro/DonemSecici";
import { OzetKart } from "@/components/modules/bordro/OzetKart";
import { OdemelerTab } from "@/components/modules/bordro/tabs/OdemelerTab";
import { KesintilerTab } from "@/components/modules/bordro/tabs/KesintilerTab";
import { NotBilgiTab } from "@/components/modules/bordro/tabs/NotBilgiTab";

// ── Hooks & Utils ──
import { useUIStore } from "@/stores/uiStore";
import {
  useDonemPersoneller,
  usePersonelBordro,
  useGecenAyAvans,
  useInvalidateBordro,
} from "@/hooks/useMaasBordro";
import { useAyarlar } from "@/hooks/useAyarlar";
import { useBordroForm } from "@/hooks/useBordroForm";
import { bordroKaydet, ekKalemKaydet } from "@/app/actions/maas";
import { avansDeviriHesapla } from "@/lib/utils/maasHesap";
import { formatAdSoyad } from "@/lib/utils/index";
import { VARSAYILAN_AYLIK_CALISMA_SAATI } from "@/lib/constants";

// ─── Sabitler ────────────────────────────────────────────────

const TAB_STORAGE_KEY = "bordro-veri-girisi-aktif-tab";
const VARSAYILAN_TAB  = "odemeler";

// ─── Ana View ────────────────────────────────────────────────

export function BordroVeriGirisiView() {
  // ── Global state ──
  const { seciliDonemYil, seciliDonemAy } = useUIStore();
  const [seciliPersonelId, setSeciliPersonelId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const invalidate = useInvalidateBordro();

  // ── Tab persistence ──
  const [aktifTab, setAktifTab] = useState(() => {
    if (typeof window === "undefined") return VARSAYILAN_TAB;
    return localStorage.getItem(TAB_STORAGE_KEY) ?? VARSAYILAN_TAB;
  });
  const handleTabChange = useCallback((value: string) => {
    setAktifTab(value);
    localStorage.setItem(TAB_STORAGE_KEY, value);
  }, []);

  // ── Ayarlar ──
  const { data: ayarlar } = useAyarlar();
  const aylikCalisma = ayarlar?.aylik_calisma_saati ?? VARSAYILAN_AYLIK_CALISMA_SAATI;

  // ── Data queries ──
  const {
    data: personeller = [],
    isLoading: personelYukleniyor,
    isError: personelHata,
  } = useDonemPersoneller(seciliDonemYil, seciliDonemAy);

  const siraliPersoneller = useMemo(() => {
    return [...personeller].sort((a, b) => {
      const nameA = formatAdSoyad(a.ad, a.soyad).toLocaleLowerCase("tr");
      const nameB = formatAdSoyad(b.ad, b.soyad).toLocaleLowerCase("tr");
      return nameA.localeCompare(nameB, "tr");
    });
  }, [personeller]);

  const {
    data: mevcutBordro,
    isLoading: bordroYukleniyor,
    isError: bordroHata,
  } = usePersonelBordro(seciliPersonelId, seciliDonemYil, seciliDonemAy);

  const { data: gecenAyAvans = 0 } =
    useGecenAyAvans(seciliPersonelId, seciliDonemYil, seciliDonemAy);

  // ── Query hata toastları ──
  useEffect(() => {
    if (personelHata) toast.error("Personel listesi yüklenirken hata oluştu.");
  }, [personelHata]);

  useEffect(() => {
    if (bordroHata) toast.error("Bordro verisi yüklenirken hata oluştu.");
  }, [bordroHata]);

  // ── Seçilen personelin aktif maaşı ──
  const seciliPersonel = personeller.find((p) => p.id === seciliPersonelId);
  const aktifMaas =
    seciliPersonel?.maas_gecmisi?.find(
      (m: { gecerlilik_bitis: string | null }) => m.gecerlilik_bitis === null
    )?.maas_net ?? 0;

  // ── Form state (useReducer) + memoized hesaplama ──
  const { state, dispatch, setField, hesap, isDirty, markSaved } = useBordroForm({
    mevcutBordro: mevcutBordro ?? null,
    seciliPersonelId,
    bordroYukleniyor,
    aktifMaas,
    aylikCalisma,
  });

  // ── İçeri avans devir hesabı ──
  const iceriAvansDevredilecek = useMemo(
    () => avansDeviriHesapla(gecenAyAvans, state.iceriAvansVerilen, state.iceriAvansKesinti),
    [gecenAyAvans, state.iceriAvansVerilen, state.iceriAvansKesinti]
  );

  // ── Durum kontrolleri ──
  const kilitli         = mevcutBordro?.durum === "kilitlendi";
  const onaylandi       = mevcutBordro?.durum === "onaylandi";
  const duzenlemeKapali = kilitli || onaylandi;
  const yukleniyor      = bordroYukleniyor || personelYukleniyor;

  // ── Personel değiştiğinde "kaydedilmemiş değişiklik" uyarısı ──
  const handlePersonelChange = useCallback(
    (yeniId: string | null) => {
      if (isDirty && seciliPersonelId) {
        const devam = window.confirm(
          "Kaydedilmemiş değişiklikler var. Personel değiştirmek istediğinizden emin misiniz?"
        );
        if (!devam) return;
      }
      setSeciliPersonelId(yeniId);
    },
    [isDirty, seciliPersonelId]
  );

  const handleAciklamaChange = useCallback(
    (value: string) => dispatch({ type: "SET_ACIKLAMA", value }),
    [dispatch]
  );

  // ── Kaydet ──
  const handleKaydet = useCallback(() => {
    if (!seciliPersonelId) {
      toast.error("Personel seçin.");
      return;
    }
    if (duzenlemeKapali) {
      toast.error(
        kilitli
          ? "Bu bordro kilitli — düzenleme yapılamaz."
          : "Bu bordro onaylandı — düzenleme için revizyon başlatın."
      );
      return;
    }
    if (aktifMaas <= 0) {
      toast.error("Bu personele ait aktif maaş kaydı bulunamadı.");
      return;
    }

    startTransition(async () => {
      // 1) Ana bordro satırını kaydet
      const sonuc = await bordroKaydet({
        personel_id:         seciliPersonelId,
        donem_yil:           seciliDonemYil,
        donem_ay:            seciliDonemAy,
        maas_net:            aktifMaas,
        calisma_saati:       state.calismaSaati,
        mesai_saati:         state.mesaiSaati,
        yol:                 state.yol,
        yemek:               state.yemek,
        prim:                state.prim,
        tazminat:            state.tazminat,
        senelik_izin:        state.senelikIzin,
        banka:               state.banka,
        bes:                 state.bes,
        avans:               state.avans,
        icra:                state.icra,
        iceri_avans_kesinti: state.iceriAvansKesinti,
        iceri_avans_devir:   gecenAyAvans,
        iceri_avans_verilen: state.iceriAvansVerilen,
        yillik_izin_gun:     state.yillikIzinGun,
        aciklama:            state.aciklama || null,
        notlar:              state.notlar as unknown as import("@/supabase/types").Json,
        toplam_odeme:        hesap.toplam_odeme,
        toplam_kesinti:      hesap.toplam_kesinti,
        elden:               hesap.elden,
      });

      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }

      const bordroId = sonuc.bordroId ?? mevcutBordro?.id ?? null;

      // 2) Ek kalemleri ayrı action ile kaydet (T4.5: yeni model)
      if (bordroId) {
        // Aktif (silinmemiş veya yeni) kalemler — _isDeleted olanları gönderme
        const aktifOdemeler = state.ekOdemeler
          .filter((k) => !k._isDeleted)
          .map((k, i) => ({ id: k._isNew ? undefined : k.id, ad: k.ad, tutar: k.tutar, sira: i }));

        const aktifKesintiler = state.ekKesintiler
          .filter((k) => !k._isDeleted)
          .map((k, i) => ({ id: k._isNew ? undefined : k.id, ad: k.ad, tutar: k.tutar, sira: i }));

        const [odemeRes, kesintRes] = await Promise.all([
          ekKalemKaydet(bordroId, "odeme", aktifOdemeler),
          ekKalemKaydet(bordroId, "kesinti", aktifKesintiler),
        ]);

        if (odemeRes?.hata) { toast.error(`Ek ödemeler kaydedilemedi: ${odemeRes.hata}`); return; }
        if (kesintRes?.hata) { toast.error(`Ek kesintiler kaydedilemedi: ${kesintRes.hata}`); return; }
      }

      toast.success("Bordro kaydedildi.");
      markSaved(bordroId);
      invalidate(seciliDonemYil, seciliDonemAy, seciliPersonelId);
    });
  }, [
    seciliPersonelId, duzenlemeKapali, kilitli, aktifMaas,
    state, hesap, gecenAyAvans, mevcutBordro,
    seciliDonemYil, seciliDonemAy,
    markSaved, invalidate,
  ]);

  // ── Ctrl+S / Cmd+S ile kaydet ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleKaydet();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKaydet]);

  // ── Tooltip mesajı ──
  const kaydetDisabled = isPending || !seciliPersonelId || duzenlemeKapali;
  const kaydetTooltip  = !seciliPersonelId
    ? "Önce personel seçin"
    : kilitli
      ? "Bu bordro kilitli — düzenleme yapılamaz"
      : onaylandi
        ? "Bu bordro onaylandı — revizyon başlatın"
        : undefined;

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Üst kontroller ── */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <DonemSecici />
          <div className="w-64">
            <Select
              value={seciliPersonelId ?? ""}
              onValueChange={(v) => handlePersonelChange(v || null)}
              disabled={personelYukleniyor}
            >
              <SelectTrigger id="select-personel">
                <SelectValue placeholder={personelYukleniyor ? "Yükleniyor…" : "Personel seçin…"}>
                  {seciliPersonel
                    ? formatAdSoyad(seciliPersonel.ad, seciliPersonel.soyad)
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {siraliPersoneller.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {formatAdSoyad(p.ad, p.soyad)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* isDirty göstergesi */}
          {isDirty && seciliPersonelId && (
            <span className="text-xs text-amber-600 dark:text-amber-400 animate-pulse">
              ● Kaydedilmemiş değişiklikler
            </span>
          )}
        </div>

        {/* Tooltip: render={<span />} ile TooltipTrigger'ın kendi <button>'ı span'a dönüşür.
            Böylece <button><button> (hydration hatası) önlenir. */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button
                id="btn-bordro-kaydet"
                onClick={handleKaydet}
                disabled={kaydetDisabled}
                className="gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Kaydet
              </Button>
            </TooltipTrigger>
            {kaydetTooltip && (
              <TooltipContent>
                <p>{kaydetTooltip}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ── Durum uyarısı ── */}
      {duzenlemeKapali && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
          {kilitli
            ? "🔒 Bu bordro kilitli — düzenleme yapılamaz."
            : "✅ Bu bordro onaylandı — düzenleme için revizyon başlatın."}
        </div>
      )}

      {/* ── Özet kartları ── */}
      <OzetKart
        toplamOdeme={hesap.toplam_odeme}
        toplamKesinti={hesap.toplam_kesinti}
        elden={hesap.elden}
        yukleniyor={yukleniyor}
      />

      {/* ── Tab içeriği ── */}
      {!seciliPersonelId ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <p className="text-3xl mb-3">📋</p>
          <p>Veri girmek için yukarıdan personel seçin.</p>
        </div>
      ) : personelHata || bordroHata ? (
        <div className="rounded-xl border border-destructive bg-destructive/5 p-12 text-center text-destructive">
          <p className="text-3xl mb-3">⚠️</p>
          <p>Veri yüklenirken hata oluştu. Lütfen sayfayı yenileyin.</p>
        </div>
      ) : !personelYukleniyor && personeller.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <p className="text-3xl mb-3">👤</p>
          <p>Bu dönemde aktif personel bulunamadı.</p>
          <p className="text-xs mt-1">Personelin istihdam dönemi bu ayı kapsamıyor olabilir.</p>
        </div>
      ) : yukleniyor ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <Tabs value={aktifTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="odemeler"  id="tab-odemeler">Ödemeler</TabsTrigger>
            <TabsTrigger value="kesintiler" id="tab-kesintiler">Kesintiler</TabsTrigger>
            <TabsTrigger value="notlar"    id="tab-notlar-bilgi">Not & Bilgi</TabsTrigger>
          </TabsList>

          <TabsContent value="odemeler">
            <OdemelerTab
              state={state}
              dispatch={dispatch}
              onFieldChange={setField}
              hesap={hesap}
              aktifMaas={aktifMaas}
              disabled={duzenlemeKapali}
            />
          </TabsContent>

          <TabsContent value="kesintiler">
            <KesintilerTab
              state={state}
              dispatch={dispatch}
              onFieldChange={setField}
              hesap={hesap}
              gecenAyAvans={gecenAyAvans}
              iceriAvansDevredilecek={iceriAvansDevredilecek}
              disabled={duzenlemeKapali}
            />
          </TabsContent>

          <TabsContent value="notlar">
            <NotBilgiTab
              state={state}
              dispatch={dispatch}
              onFieldChange={setField}
              onAciklamaChange={handleAciklamaChange}
              disabled={duzenlemeKapali}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
