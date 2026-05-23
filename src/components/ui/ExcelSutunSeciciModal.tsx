"use client";

/**
 * src/components/ui/ExcelSutunSeciciModal.tsx
 *
 * Kullanıcının hangi sütunları export edeceğini seçebildiği modal.
 * Sabit sütun setleri + özel seçim destekler.
 *
 * Kullanım:
 *   <ExcelSutunSeciciModal
 *     acik={modalAcik}
 *     onKapat={() => setModalAcik(false)}
 *     tumSutunlar={PERSONEL_TUM_SUTUNLAR}
 *     sutunSetleri={PERSONEL_SUTUN_SETLERI}
 *     onExport={(seciliSutunlar) => personelListesiExport(veri, { sutunlar: seciliSutunlar })}
 *   />
 */

import { useState } from "react";
import { FileSpreadsheet, Loader2, CheckSquare, Square, LayoutList } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SutunTanimi, SutunSeti } from "@/lib/excel/exportUtils";

// ─────────────────────────────────────────────
// Tipler
// ─────────────────────────────────────────────

interface ExcelSutunSeciciModalProps<T> {
  acik: boolean;
  onKapat: () => void;
  /** Tüm seçilebilir sütunlar */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tumSutunlar: SutunTanimi<any>[];
  /** Hazır sütun setleri */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sutunSetleri: SutunSeti<any>[];
  /** Seçilen sütunlarla export çağrısı */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onExport: (sutunlar: SutunTanimi<any>[]) => void | Promise<void>;
  /** Modal başlığı */
  baslik?: string;
}

// ─────────────────────────────────────────────
// Bileşen
// ─────────────────────────────────────────────

export function ExcelSutunSeciciModal<T>({
  acik,
  onKapat,
  tumSutunlar,
  sutunSetleri,
  onExport,
  baslik = "Excel'e Aktar",
}: ExcelSutunSeciciModalProps<T>) {
  // "set" = sabit set seçimi, "ozel" = özel sütun seçimi
  const [mod, setMod] = useState<"set" | "ozel">("set");
  const [seciliSetId, setSeciliSetId] = useState<string>(sutunSetleri[0]?.id ?? "");
  const [seciliSutunlar, setSeciliSutunlar] = useState<Set<string>>(
    () => new Set(tumSutunlar.map((s) => s.baslik))
  );
  const [yukleniyor, setYukleniyor] = useState(false);

  function toggleSutun(baslik: string) {
    setSeciliSutunlar((prev) => {
      const yeni = new Set(prev);
      if (yeni.has(baslik)) {
        yeni.delete(baslik);
      } else {
        yeni.add(baslik);
      }
      return yeni;
    });
  }

  function hepsiniSec() {
    setSeciliSutunlar(new Set(tumSutunlar.map((s) => s.baslik)));
  }

  function hepsiniKaldir() {
    setSeciliSutunlar(new Set());
  }

  async function handleExport() {
    let sutunlar: SutunTanimi<unknown>[];

    if (mod === "set") {
      const set = sutunSetleri.find((s) => s.id === seciliSetId);
      sutunlar = set?.sutunlar ?? tumSutunlar;
    } else {
      sutunlar = tumSutunlar.filter((s) => seciliSutunlar.has(s.baslik));
    }

    if (sutunlar.length === 0) {
      toast.error("En az 1 sütun seçmelisiniz.");
      return;
    }

    setYukleniyor(true);
    try {
      await onExport(sutunlar);
      toast.success("Excel dosyası indirildi.");
      onKapat();
    } catch (err) {
      console.error("[ExcelExport]", err);
      toast.error("Excel oluşturulurken hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  }

  const ozelSeciliSayi = mod === "ozel" ? seciliSutunlar.size : 0;

  return (
    <Dialog open={acik} onOpenChange={onKapat}>
      <DialogContent className="sm:max-w-md" id="dialog-excel-sutun-secici">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            {baslik}
          </DialogTitle>
        </DialogHeader>

        {/* Mod seçimi */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          <button
            onClick={() => setMod("set")}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 transition-colors ${
              mod === "set"
                ? "bg-emerald-600 text-white"
                : "bg-background hover:bg-muted"
            }`}
          >
            <LayoutList className="h-4 w-4" />
            Hazır Set
          </button>
          <button
            onClick={() => setMod("ozel")}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 transition-colors ${
              mod === "ozel"
                ? "bg-emerald-600 text-white"
                : "bg-background hover:bg-muted"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            Özel Seçim
          </button>
        </div>

        {/* Hazır set seçimi */}
        {mod === "set" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Bir sütun seti seçin:</p>
            <div className="space-y-2">
              {sutunSetleri.map((set) => {
                const secili = seciliSetId === set.id;
                return (
                  <button
                    key={set.id}
                    onClick={() => setSeciliSetId(set.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      secili
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium text-sm ${secili ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
                        {set.etiket}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {set.sutunlar.length} sütun
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {set.sutunlar.map((s) => s.baslik).join(", ")}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Özel sütun seçimi */}
        {mod === "ozel" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {ozelSeciliSayi} / {tumSutunlar.length} sütun seçili
              </p>
              <div className="flex gap-2">
                <button
                  onClick={hepsiniSec}
                  className="text-xs text-primary hover:underline"
                >
                  Tümünü Seç
                </button>
                <span className="text-muted-foreground text-xs">·</span>
                <button
                  onClick={hepsiniKaldir}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Temizle
                </button>
              </div>
            </div>
            <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
              {tumSutunlar.map((sutun) => {
                const secili = seciliSutunlar.has(sutun.baslik);
                return (
                  <button
                    key={sutun.baslik}
                    onClick={() => toggleSutun(sutun.baslik)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                  >
                    {secili ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm">{sutun.baslik}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onKapat} disabled={yukleniyor}>
            İptal
          </Button>
          <Button
            id="btn-excel-export-onayla"
            onClick={handleExport}
            disabled={yukleniyor || (mod === "ozel" && seciliSutunlar.size === 0)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {yukleniyor ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            İndir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
