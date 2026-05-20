"use client";

/**
 * Ödemeler tab içeriği.
 * T4.2: EkKalemEditor kaldırıldı → inline EkKalemRow editörü.
 * Net maaş, çalışma/mesai saatleri, yol/yemek/prim/tazminat/senelik izin ve ek ödemeler.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { formatPara, num } from "@/lib/utils/index";
import { MAX_EK_ODEME } from "@/lib/constants";
import type { BordroFormState, BordroNumericField, EkKalemRow } from "@/types/bordro-form";
import type { BordroHesapCikti } from "@/lib/utils/maasHesap";
import type { BordroFormAction } from "@/hooks/useBordroForm";

// ─── Props ───────────────────────────────────────────────────

interface OdemelerTabProps {
  state: BordroFormState;
  dispatch: React.Dispatch<BordroFormAction>;
  onFieldChange: (field: BordroNumericField, value: number) => void;
  hesap: BordroHesapCikti;
  aktifMaas: number;
  disabled: boolean;
}

// ─── Yardımcı: Sayısal Input ─────────────────────────────────

function NumericField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={value || ""}
        onChange={(e) => onChange(num(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} disabled className="bg-muted" />
    </div>
  );
}

// ─── Inline Ek Kalem Satırı ─────────────────────────────────

function EkKalemSatiri({
  kalem,
  onAdChange,
  onTutarChange,
  onSil,
  disabled,
  index,
}: {
  kalem: EkKalemRow;
  onAdChange: (v: string) => void;
  onTutarChange: (v: number) => void;
  onSil: () => void;
  disabled: boolean;
  index: number;
}) {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 space-y-1">
        <Label htmlFor={`ek-odeme-ad-${index}`} className="text-xs">
          Açıklama
        </Label>
        <Input
          id={`ek-odeme-ad-${index}`}
          value={kalem.ad}
          onChange={(e) => onAdChange(e.target.value)}
          disabled={disabled}
          placeholder="Ödeme adı…"
        />
      </div>
      <div className="w-32 space-y-1">
        <Label htmlFor={`ek-odeme-tutar-${index}`} className="text-xs">
          Tutar (₺)
        </Label>
        <Input
          id={`ek-odeme-tutar-${index}`}
          type="number"
          value={kalem.tutar || ""}
          onChange={(e) => onTutarChange(num(e.target.value))}
          disabled={disabled}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onSil}
        disabled={disabled}
        className="text-destructive hover:text-destructive shrink-0"
        aria-label="Ek ödemeyi sil"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

// ─── Bileşen ─────────────────────────────────────────────────

export function OdemelerTab({
  state,
  dispatch,
  onFieldChange,
  hesap,
  aktifMaas,
  disabled,
}: OdemelerTabProps) {
  // Silinmemiş aktif kalemler (render için)
  const gorunurKalemler = state.ekOdemeler.filter((k) => !k._isDeleted);
  const kalemEklenebilir = !disabled && gorunurKalemler.length < MAX_EK_ODEME;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sol kolon: Maaş & Çalışma */}
        <div className="space-y-4">
          <ReadonlyField label="Net Maaş (Aktif)" value={formatPara(aktifMaas)} />
          <ReadonlyField label="Saatlik Ücret (oh)" value={formatPara(hesap.saatlik_ucret)} />
          <NumericField
            id="calisma-saati"
            label="Çalışma Saati"
            value={state.calismaSaati}
            onChange={(v) => onFieldChange("calismaSaati", v)}
            disabled={disabled}
          />
          <ReadonlyField label="Hak Ediş (oh)" value={formatPara(hesap.hak_edis)} />
          <NumericField
            id="mesai-saati"
            label="Mesai Saati"
            value={state.mesaiSaati}
            onChange={(v) => onFieldChange("mesaiSaati", v)}
            disabled={disabled}
          />
          <ReadonlyField label="Mesai Bedeli (oh)" value={formatPara(hesap.mesai_bedeli)} />
        </div>

        {/* Sağ kolon: Ek kalemler */}
        <div className="space-y-4">
          <NumericField
            id="yol"
            label="Yol"
            value={state.yol}
            onChange={(v) => onFieldChange("yol", v)}
            disabled={disabled}
          />
          <NumericField
            id="yemek"
            label="Yemek"
            value={state.yemek}
            onChange={(v) => onFieldChange("yemek", v)}
            disabled={disabled}
          />
          <NumericField
            id="prim"
            label="Prim"
            value={state.prim}
            onChange={(v) => onFieldChange("prim", v)}
            disabled={disabled}
          />
          <NumericField
            id="tazminat"
            label="Tazminat"
            value={state.tazminat}
            onChange={(v) => onFieldChange("tazminat", v)}
            disabled={disabled}
          />
          <NumericField
            id="senelik-izin"
            label="Senelik İzin Ücreti"
            value={state.senelikIzin}
            onChange={(v) => onFieldChange("senelikIzin", v)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* ── Ek Ödemeler (inline, EkKalemRow modeli) ── */}
      <div className="pt-2 border-t space-y-3">
        <div className="flex items-center justify-between">
          <Label>
            Ek Ödemeler{" "}
            <span className="text-muted-foreground text-xs font-normal">
              ({gorunurKalemler.length}/{MAX_EK_ODEME})
            </span>
          </Label>
          {kalemEklenebilir && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: "EK_ODEME_EKLE" })}
            >
              <Plus className="size-3.5 mr-1" />
              Ekle
            </Button>
          )}
        </div>

        {gorunurKalemler.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Ek ödeme yok.{" "}
            {!disabled && <span className="italic">Ekle butonuyla yeni kalem ekleyebilirsiniz.</span>}
          </p>
        ) : (
          <div className="space-y-2">
            {state.ekOdemeler.map((kalem, idx) =>
              kalem._isDeleted ? null : (
                <EkKalemSatiri
                  key={kalem.id}
                  kalem={kalem}
                  index={idx}
                  onAdChange={(v) =>
                    dispatch({ type: "EK_ODEME_GUNCELLE", id: kalem.id, field: "ad", value: v })
                  }
                  onTutarChange={(v) =>
                    dispatch({ type: "EK_ODEME_GUNCELLE", id: kalem.id, field: "tutar", value: v })
                  }
                  onSil={() => dispatch({ type: "EK_ODEME_SIL", id: kalem.id })}
                  disabled={disabled}
                />
              )
            )}
          </div>
        )}

        {gorunurKalemler.length > 0 && (
          <div className="flex justify-end">
            <span className="text-sm font-semibold">
              Toplam: {formatPara(hesap.ek_odemeler_toplam)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
