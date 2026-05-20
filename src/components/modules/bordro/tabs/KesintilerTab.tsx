"use client";

/**
 * Kesintiler tab içeriği.
 * T4.3: EkKalemEditor kaldırıldı → inline EkKalemRow editörü.
 * Banka, BES, avans, icra, içeri avans takibi ve ek kesintiler.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { formatPara, num } from "@/lib/utils/index";
import { MAX_EK_KESINTI } from "@/lib/constants";
import type { BordroFormState, BordroNumericField, EkKalemRow } from "@/types/bordro-form";
import type { BordroHesapCikti } from "@/lib/utils/maasHesap";
import type { BordroFormAction } from "@/hooks/useBordroForm";

// ─── Props ───────────────────────────────────────────────────

interface KesintilerTabProps {
  state: BordroFormState;
  dispatch: React.Dispatch<BordroFormAction>;
  onFieldChange: (field: BordroNumericField, value: number) => void;
  hesap: BordroHesapCikti;
  gecenAyAvans: number;
  iceriAvansDevredilecek: number;
  disabled: boolean;
}

// ─── Yardımcı ────────────────────────────────────────────────

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

function ReadonlyField({
  label,
  value,
  labelClassName,
  inputClassName,
}: {
  label: string;
  value: string;
  labelClassName?: string;
  inputClassName?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className={labelClassName}>{label}</Label>
      <Input value={value} disabled className={inputClassName ?? "bg-muted"} />
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
        <Label htmlFor={`ek-kesinti-ad-${index}`} className="text-xs">
          Açıklama
        </Label>
        <Input
          id={`ek-kesinti-ad-${index}`}
          value={kalem.ad}
          onChange={(e) => onAdChange(e.target.value)}
          disabled={disabled}
          placeholder="Kesinti adı…"
        />
      </div>
      <div className="w-32 space-y-1">
        <Label htmlFor={`ek-kesinti-tutar-${index}`} className="text-xs">
          Tutar (₺)
        </Label>
        <Input
          id={`ek-kesinti-tutar-${index}`}
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
        aria-label="Ek kesintiyi sil"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

// ─── Bileşen ─────────────────────────────────────────────────

export function KesintilerTab({
  state,
  dispatch,
  onFieldChange,
  hesap,
  gecenAyAvans,
  iceriAvansDevredilecek,
  disabled,
}: KesintilerTabProps) {
  const gorunurKalemler = state.ekKesintiler.filter((k) => !k._isDeleted);
  const kalemEklenebilir = !disabled && gorunurKalemler.length < MAX_EK_KESINTI;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sol kolon: Kesinti alanları */}
        <div className="space-y-4">
          <NumericField
            id="banka"
            label="Banka"
            value={state.banka}
            onChange={(v) => onFieldChange("banka", v)}
            disabled={disabled}
          />
          <NumericField
            id="bes"
            label="BES"
            value={state.bes}
            onChange={(v) => onFieldChange("bes", v)}
            disabled={disabled}
          />
          <NumericField
            id="avans"
            label="Avans"
            value={state.avans}
            onChange={(v) => onFieldChange("avans", v)}
            disabled={disabled}
          />
          <NumericField
            id="icra"
            label="İcra"
            value={state.icra}
            onChange={(v) => onFieldChange("icra", v)}
            disabled={disabled}
          />
          <NumericField
            id="iceri-avans-kesinti"
            label="İçeri Avans Kesinti"
            value={state.iceriAvansKesinti}
            onChange={(v) => onFieldChange("iceriAvansKesinti", v)}
            disabled={disabled}
          />
        </div>

        {/* Sağ kolon: İçeri Avans Takibi */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
            <p className="text-sm font-semibold">İçeri Avans Takibi</p>
            <ReadonlyField
              label="Geçen Aydan Devredilen (oh)"
              value={formatPara(gecenAyAvans)}
              labelClassName="text-xs text-muted-foreground"
            />
            <NumericField
              id="iceri-avans-verilen"
              label="Bu Ay Verilen"
              value={state.iceriAvansVerilen}
              onChange={(v) => onFieldChange("iceriAvansVerilen", v)}
              disabled={disabled}
            />
            <ReadonlyField
              label="Bu Ay Kesilen (oh)"
              value={formatPara(state.iceriAvansKesinti)}
              labelClassName="text-xs text-muted-foreground"
            />
            <ReadonlyField
              label="Devredilecek (oh)"
              value={formatPara(iceriAvansDevredilecek)}
              labelClassName="text-xs font-semibold"
              inputClassName="bg-muted font-bold"
            />
          </div>
        </div>
      </div>

      {/* ── Ek Kesintiler (inline, EkKalemRow modeli) ── */}
      <div className="pt-2 border-t space-y-3">
        <div className="flex items-center justify-between">
          <Label>
            Ek Kesintiler{" "}
            <span className="text-muted-foreground text-xs font-normal">
              ({gorunurKalemler.length}/{MAX_EK_KESINTI})
            </span>
          </Label>
          {kalemEklenebilir && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: "EK_KESINTI_EKLE" })}
            >
              <Plus className="size-3.5 mr-1" />
              Ekle
            </Button>
          )}
        </div>

        {gorunurKalemler.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Ek kesinti yok.{" "}
            {!disabled && <span className="italic">Ekle butonuyla yeni kalem ekleyebilirsiniz.</span>}
          </p>
        ) : (
          <div className="space-y-2">
            {state.ekKesintiler.map((kalem, idx) =>
              kalem._isDeleted ? null : (
                <EkKalemSatiri
                  key={kalem.id}
                  kalem={kalem}
                  index={idx}
                  onAdChange={(v) =>
                    dispatch({ type: "EK_KESINTI_GUNCELLE", id: kalem.id, field: "ad", value: v })
                  }
                  onTutarChange={(v) =>
                    dispatch({
                      type: "EK_KESINTI_GUNCELLE",
                      id: kalem.id,
                      field: "tutar",
                      value: v,
                    })
                  }
                  onSil={() => dispatch({ type: "EK_KESINTI_SIL", id: kalem.id })}
                  disabled={disabled}
                />
              )
            )}
          </div>
        )}

        {gorunurKalemler.length > 0 && (
          <div className="flex justify-end">
            <span className="text-sm font-semibold">
              Toplam: {formatPara(hesap.ek_kesintiler_toplam)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
