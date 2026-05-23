"use client";

/**
 * src/components/ui/ExcelExportButton.tsx
 *
 * Yeniden kullanılabilir Excel export butonu.
 * Tüm tablolarda ortak kullanılır.
 */

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ExcelExportButtonProps {
  /** Export fonksiyonu — sync veya async */
  onExport: () => void | Promise<void>;
  /** Buton etiketi */
  label?: string;
  /** Disabled durumu (veri yüklenirken vb.) */
  disabled?: boolean;
  /** Buton ID'si (test için) */
  id?: string;
  /** Buton boyutu */
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExcelExportButton({
  onExport,
  label = "Excel'e Aktar",
  disabled = false,
  id,
  size = "sm",
}: ExcelExportButtonProps) {
  const [yukleniyor, setYukleniyor] = useState(false);

  async function handleClick() {
    if (yukleniyor || disabled) return;
    setYukleniyor(true);
    try {
      await onExport();
      toast.success("Excel dosyası indirildi.");
    } catch (err) {
      console.error("[ExcelExport]", err);
      toast.error("Excel oluşturulurken hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <Button
      id={id}
      variant="outline"
      size={size}
      onClick={handleClick}
      disabled={disabled || yukleniyor}
      className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950"
    >
      {yukleniyor ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
