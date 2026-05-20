"use client";

/**
 * Not & Bilgi tab içeriği.
 * T4.4: NotlarEditor kaldırıldı → inline not editörü (dispatch tabanlı).
 * Yıllık izin günü, notlar listesi ve genel açıklama.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { num } from "@/lib/utils/index";
import { MAX_NOT } from "@/lib/constants";
import type { BordroFormState, BordroNumericField } from "@/types/bordro-form";
import type { BordroFormAction } from "@/hooks/useBordroForm";

// ─── Props ───────────────────────────────────────────────────

interface NotBilgiTabProps {
  state: BordroFormState;
  dispatch: React.Dispatch<BordroFormAction>;
  onFieldChange: (field: BordroNumericField, value: number) => void;
  onAciklamaChange: (value: string) => void;
  disabled: boolean;
}

// ─── Bileşen ─────────────────────────────────────────────────

export function NotBilgiTab({
  state,
  dispatch,
  onFieldChange,
  onAciklamaChange,
  disabled,
}: NotBilgiTabProps) {
  const notEklenebilir = !disabled && state.notlar.length < MAX_NOT;

  return (
    <div className="space-y-4">
      {/* Yıllık İzin */}
      <div className="space-y-1.5">
        <Label htmlFor="yillik-izin-gun">Yıllık İzin (Gün)</Label>
        <Input
          id="yillik-izin-gun"
          type="number"
          value={state.yillikIzinGun || ""}
          onChange={(e) => onFieldChange("yillikIzinGun", num(e.target.value))}
          disabled={disabled}
          className="max-w-xs"
        />
      </div>

      {/* ── Notlar (inline editör) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>
            Notlar{" "}
            <span className="text-muted-foreground text-xs font-normal">
              ({state.notlar.length}/{MAX_NOT})
            </span>
          </Label>
          {notEklenebilir && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: "NOT_EKLE" })}
            >
              <Plus className="size-3.5 mr-1" />
              Not Ekle
            </Button>
          )}
        </div>

        {state.notlar.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Not yok.{" "}
            {!disabled && <span className="italic">Not Ekle butonuyla not ekleyebilirsiniz.</span>}
          </p>
        ) : (
          <div className="space-y-2">
            {state.notlar.map((not, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <Textarea
                  id={`not-${idx}`}
                  value={not.metin}
                  onChange={(e) =>
                    dispatch({ type: "NOT_GUNCELLE", index: idx, value: e.target.value })
                  }
                  disabled={disabled}
                  rows={2}
                  placeholder={`Not ${idx + 1}…`}
                  className="flex-1 resize-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => dispatch({ type: "NOT_SIL", index: idx })}
                  disabled={disabled}
                  className="text-destructive hover:text-destructive mt-1 shrink-0"
                  aria-label={`${idx + 1}. notu sil`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Açıklama */}
      <div className="space-y-1.5">
        <Label htmlFor="aciklama">Açıklama</Label>
        <Textarea
          id="aciklama"
          value={state.aciklama}
          onChange={(e) => onAciklamaChange(e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder="Bordro ile ilgili genel açıklama…"
        />
      </div>
    </div>
  );
}
