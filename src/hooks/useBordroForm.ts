"use client";

/**
 * src/hooks/useBordroForm.ts
 *
 * Bordro veri girişi formunun tüm state yönetimini kapsüller.
 * 18 ayrı useState yerine tek useReducer kullanır.
 * Form init / reset mantığını da hook içinde barındırır (lastInitRef).
 *
 * T3.2 değişiklikleri:
 *   - EkKalem[] → EkKalemRow[] (DB tabanlı model, _isNew / _isDeleted flag'leri)
 *   - isDirty → JSON.stringify yerine field-by-field shallow compare (performans)
 *   - bordroToFormState → bordro_ek_kalem join verisini okur
 *
 * Kullanım:
 *   const { state, dispatch, setField, isDirty, hesap } = useBordroForm({
 *     mevcutBordro, seciliPersonelId, bordroYukleniyor,
 *     aktifMaas, aylikCalisma,
 *   });
 */

import { useReducer, useCallback, useEffect, useRef, useMemo, useState } from "react";
import type { BordroNot } from "@/supabase/app-types";
import type { PersonelBordroWithKalemler } from "@/hooks/useMaasBordro";
import {
  type BordroFormState,
  type BordroNumericField,
  type EkKalemRow,
  INITIAL_FORM_STATE,
} from "@/types/bordro-form";
import { bordroyuHesapla, type BordroHesapCikti } from "@/lib/utils/maasHesap";

// ─── Action Tipleri ──────────────────────────────────────────

type BordroFormAction =
  | { type: "SET_FIELD"; field: BordroNumericField; value: number }
  | { type: "SET_ACIKLAMA"; value: string }

  // ── Ek Ödemeler (EkKalemRow modeli) ──
  | { type: "EK_ODEME_EKLE" }
  | { type: "EK_ODEME_SIL"; id: string }
  | { type: "EK_ODEME_GUNCELLE"; id: string; field: "ad" | "tutar"; value: string | number }
  | { type: "SET_EK_ODEMELER"; value: EkKalemRow[] }

  // ── Ek Kesintiler (EkKalemRow modeli) ──
  | { type: "EK_KESINTI_EKLE" }
  | { type: "EK_KESINTI_SIL"; id: string }
  | { type: "EK_KESINTI_GUNCELLE"; id: string; field: "ad" | "tutar"; value: string | number }
  | { type: "SET_EK_KESINTILER"; value: EkKalemRow[] }

  // ── Notlar ──
  | { type: "NOT_EKLE" }
  | { type: "NOT_SIL"; index: number }
  | { type: "NOT_GUNCELLE"; index: number; value: string }
  | { type: "SET_NOTLAR"; value: BordroNot[] }

  // ── Toplu işlemler ──
  | { type: "INIT_FROM_BORDRO"; payload: BordroFormState }
  | { type: "RESET" };

export type { BordroFormAction };

// ─── Yardımcılar ─────────────────────────────────────────────

function updateById(
  arr: EkKalemRow[],
  id: string,
  updater: (item: EkKalemRow) => EkKalemRow
): EkKalemRow[] {
  return arr.map((item) => (item.id === id ? updater(item) : item));
}

function nextSira(arr: EkKalemRow[]): number {
  const aktif = arr.filter((k) => !k._isDeleted);
  return aktif.length > 0 ? Math.max(...aktif.map((k) => k.sira)) + 1 : 0;
}

// ─── Reducer ─────────────────────────────────────────────────

function bordroFormReducer(
  state: BordroFormState,
  action: BordroFormAction
): BordroFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "SET_ACIKLAMA":
      return { ...state, aciklama: action.value };

    // ── Ek Ödemeler ──
    case "EK_ODEME_EKLE":
      return {
        ...state,
        ekOdemeler: [
          ...state.ekOdemeler,
          {
            id: crypto.randomUUID(),
            ad: "",
            tutar: 0,
            sira: nextSira(state.ekOdemeler),
            _isNew: true,
          },
        ],
      };

    case "EK_ODEME_SIL":
      return {
        ...state,
        ekOdemeler: state.ekOdemeler.map((k) =>
          k.id === action.id
            ? k._isNew
              ? { ...k, _isDeleted: true } // yeni → doğrudan işaretle (insert edilmeyecek)
              : { ...k, _isDeleted: true }  // mevcut → _isDeleted ile işaretle
            : k
        ),
      };

    case "EK_ODEME_GUNCELLE":
      return {
        ...state,
        ekOdemeler: updateById(state.ekOdemeler, action.id, (item) => ({
          ...item,
          [action.field]: action.value,
        })),
      };

    case "SET_EK_ODEMELER":
      return { ...state, ekOdemeler: action.value };

    // ── Ek Kesintiler ──
    case "EK_KESINTI_EKLE":
      return {
        ...state,
        ekKesintiler: [
          ...state.ekKesintiler,
          {
            id: crypto.randomUUID(),
            ad: "",
            tutar: 0,
            sira: nextSira(state.ekKesintiler),
            _isNew: true,
          },
        ],
      };

    case "EK_KESINTI_SIL":
      return {
        ...state,
        ekKesintiler: state.ekKesintiler.map((k) =>
          k.id === action.id ? { ...k, _isDeleted: true } : k
        ),
      };

    case "EK_KESINTI_GUNCELLE":
      return {
        ...state,
        ekKesintiler: updateById(state.ekKesintiler, action.id, (item) => ({
          ...item,
          [action.field]: action.value,
        })),
      };

    case "SET_EK_KESINTILER":
      return { ...state, ekKesintiler: action.value };

    // ── Notlar ──
    case "NOT_EKLE":
      return { ...state, notlar: [...state.notlar, { metin: "" }] };

    case "NOT_SIL":
      return {
        ...state,
        notlar: state.notlar.filter((_, i) => i !== action.index),
      };

    case "NOT_GUNCELLE":
      return {
        ...state,
        notlar: state.notlar.map((item, i) =>
          i === action.index ? { ...item, metin: action.value } : item
        ),
      };

    case "SET_NOTLAR":
      return { ...state, notlar: action.value };

    // ── Toplu ──
    case "INIT_FROM_BORDRO":
      return { ...action.payload };

    case "RESET":
      return { ...INITIAL_FORM_STATE };

    default:
      return state;
  }
}

// ─── MaasBordro → BordroFormState dönüşümü ───────────────────

/**
 * T3.2: PersonelBordroWithKalemler tipini alır.
 * ek_odemeler/ek_kesintiler JSON yerine bordro_ek_kalem join verisini kullanır.
 */
function bordroToFormState(bordro: PersonelBordroWithKalemler): BordroFormState {
  const kalemler = bordro.bordro_ek_kalem ?? [];

  const ekOdemeler: EkKalemRow[] = kalemler
    .filter((k) => k.tip === "odeme")
    .sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0))
    .map((k) => ({ id: k.id, ad: k.ad, tutar: k.tutar, sira: k.sira ?? 0 }));

  const ekKesintiler: EkKalemRow[] = kalemler
    .filter((k) => k.tip === "kesinti")
    .sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0))
    .map((k) => ({ id: k.id, ad: k.ad, tutar: k.tutar, sira: k.sira ?? 0 }));

  return {
    calismaSaati: bordro.calisma_saati ?? 0,
    mesaiSaati:   bordro.mesai_saati ?? 0,
    yol:          bordro.yol ?? 0,
    yemek:        bordro.yemek ?? 0,
    prim:         bordro.prim ?? 0,
    tazminat:     bordro.tazminat ?? 0,
    senelikIzin:  bordro.senelik_izin ?? 0,
    ekOdemeler,
    banka:               bordro.banka ?? 0,
    bes:                 bordro.bes ?? 0,
    avans:               bordro.avans ?? 0,
    icra:                bordro.icra ?? 0,
    iceriAvansKesinti:   bordro.iceri_avans_kesinti ?? 0,
    iceriAvansVerilen:   bordro.iceri_avans_verilen ?? 0,
    ekKesintiler,
    yillikIzinGun: bordro.yillik_izin_gun ?? 0,
    notlar:        (bordro.notlar as BordroNot[]) ?? [],
    aciklama:      bordro.aciklama ?? "",
  };
}

// ─── isDirty: field-by-field shallow compare ─────────────────

/**
 * T3.2: JSON.stringify yerine alan bazlı karşılaştırma.
 * Sayısal alanlar ve string için O(1), dizi alanlar için uzunluk + id karşılaştırması.
 * Büyük ek kalem listelerinde JSON.stringify'dan belirgin şekilde hızlı.
 */
function isFormDirty(
  current: BordroFormState,
  saved: BordroFormState
): boolean {
  // Sayısal & string alanlar
  const skalarAlanlar: (keyof BordroFormState)[] = [
    "calismaSaati", "mesaiSaati", "yol", "yemek", "prim", "tazminat",
    "senelikIzin", "banka", "bes", "avans", "icra", "iceriAvansKesinti",
    "iceriAvansVerilen", "yillikIzinGun", "aciklama",
  ];

  for (const alan of skalarAlanlar) {
    if (current[alan] !== saved[alan]) return true;
  }

  // Ek ödemeler — uzunluk + her kalem için id/ad/tutar/sira/_isDeleted
  if (!kalemlerEsit(current.ekOdemeler, saved.ekOdemeler)) return true;
  if (!kalemlerEsit(current.ekKesintiler, saved.ekKesintiler)) return true;

  // Notlar — uzunluk + metin
  if (current.notlar.length !== saved.notlar.length) return true;
  for (let i = 0; i < current.notlar.length; i++) {
    if (current.notlar[i].metin !== saved.notlar[i].metin) return true;
  }

  return false;
}

function kalemlerEsit(a: EkKalemRow[], b: EkKalemRow[]): boolean {
  // Sadece aktif (silinmemiş) kalemleri karşılaştır
  const aAktif = a.filter((k) => !k._isDeleted);
  const bAktif = b.filter((k) => !k._isDeleted);
  if (aAktif.length !== bAktif.length) return false;
  for (let i = 0; i < aAktif.length; i++) {
    if (
      aAktif[i].ad    !== bAktif[i].ad   ||
      aAktif[i].tutar !== bAktif[i].tutar ||
      aAktif[i].sira  !== bAktif[i].sira
    ) return false;
  }
  return true;
}

// ─── Hook Parametreleri ──────────────────────────────────────

interface UseBordroFormParams {
  /** Mevcut bordro verisi — ek kalemler join'li (null = henüz yok / yeni bordro) */
  mevcutBordro: PersonelBordroWithKalemler | null | undefined;
  /** Seçili personel ID */
  seciliPersonelId: string | null;
  /** Bordro verisi hâlâ yükleniyor mu? */
  bordroYukleniyor: boolean;
  /** Personelin aktif net maaşı (hesaplama için) */
  aktifMaas: number;
  /** Aylık çalışma saati ayarı (hesaplama için) */
  aylikCalisma: number;
}

// ─── Hook ────────────────────────────────────────────────────

export function useBordroForm({
  mevcutBordro,
  seciliPersonelId,
  bordroYukleniyor,
  aktifMaas,
  aylikCalisma,
}: UseBordroFormParams) {
  const [state, dispatch] = useReducer(bordroFormReducer, INITIAL_FORM_STATE);

  /** Saved baseline version counter — ref değişimini useMemo'ya bildirmek için */
  const [savedVersion, setSavedVersion] = useState(0);

  const lastSavedStateRef = useRef<BordroFormState>(INITIAL_FORM_STATE);

  /** Arka plan refetch koruması — aynı bordro için iki kez init'i önler */
  const lastInitRef = useRef<{ personelId: string | null; bordroId: string | null }>({
    personelId: null,
    bordroId: null,
  });

  // ── Form init: bordro yüklenince formu doldur ──
  useEffect(() => {
    if (bordroYukleniyor) return;

    if (mevcutBordro) {
      const currentBordroId = mevcutBordro.id ?? null;

      if (
        lastInitRef.current.personelId === seciliPersonelId &&
        lastInitRef.current.bordroId === currentBordroId
      ) {
        // Aynı bordro — form verisini ezme; ama lastSavedStateRef'i refetch verisine güncelle
        const freshSaved = bordroToFormState(mevcutBordro);
        lastSavedStateRef.current = freshSaved;
        setSavedVersion((v) => v + 1); // isDirty'yi yeniden hesaplat
        return;
      }

      lastInitRef.current = { personelId: seciliPersonelId, bordroId: currentBordroId };
      const formData = bordroToFormState(mevcutBordro);
      dispatch({ type: "INIT_FROM_BORDRO", payload: formData });
      lastSavedStateRef.current = formData;
      setSavedVersion((v) => v + 1);
    } else if (seciliPersonelId) {
      if (
        lastInitRef.current.personelId === seciliPersonelId &&
        lastInitRef.current.bordroId === null
      ) {
        return;
      }

      lastInitRef.current = { personelId: seciliPersonelId, bordroId: null };
      dispatch({ type: "RESET" });
      lastSavedStateRef.current = INITIAL_FORM_STATE;
      setSavedVersion((v) => v + 1);
    }
  }, [mevcutBordro, bordroYukleniyor, seciliPersonelId]);

  /** Kayıt sonrası çağır — isDirty'yi sıfırlar, refetch'in formu ezmesini önler */
  const markSaved = useCallback(
    (bordroId: string | null) => {
      // lastInitRef'i güncelle — sonraki refetch'te INIT atlanır, form ezilmez
      lastInitRef.current = { personelId: seciliPersonelId, bordroId };
      const normalizedState: BordroFormState = {
        ...state,
        ekOdemeler: state.ekOdemeler
          .filter((k) => !k._isDeleted)
          .map((k) => ({ ...k, _isNew: undefined, _isDeleted: undefined })),
        ekKesintiler: state.ekKesintiler
          .filter((k) => !k._isDeleted)
          .map((k) => ({ ...k, _isNew: undefined, _isDeleted: undefined })),
      };
      lastSavedStateRef.current = normalizedState;
      setSavedVersion((v) => v + 1); // ← Bu satır eksikti! isDirty yeniden hesaplanır.
    },
    [seciliPersonelId, state]
  );

  const setField = useCallback(
    (field: BordroNumericField, value: number) =>
      dispatch({ type: "SET_FIELD", field, value }),
    []
  );

  // isDirty: savedVersion dep'e eklendi — markSaved/init sonrası yeniden hesaplanır
  const isDirty = useMemo(
    () => isFormDirty(state, lastSavedStateRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, savedVersion]
  );

  // Canlı hesaplama — görünen (silindi işaretlenmemiş) kalemler kullanılır
  const hesap: BordroHesapCikti = useMemo(
    () =>
      bordroyuHesapla({
        maas_net: aktifMaas,
        calisma_saati: state.calismaSaati,
        mesai_saati: state.mesaiSaati,
        yol: state.yol,
        yemek: state.yemek,
        prim: state.prim,
        tazminat: state.tazminat,
        senelik_izin: state.senelikIzin,
        ek_odemeler: state.ekOdemeler.filter((k) => !k._isDeleted),
        banka: state.banka,
        bes: state.bes,
        avans: state.avans,
        icra: state.icra,
        iceri_avans_kesinti: state.iceriAvansKesinti,
        ek_kesintiler: state.ekKesintiler.filter((k) => !k._isDeleted),
        aylik_calisma_saati: aylikCalisma,
      }),
    [state, aktifMaas, aylikCalisma]
  );

  return {
    state,
    dispatch,
    setField,
    hesap,
    isDirty,
    markSaved,
  };
}
