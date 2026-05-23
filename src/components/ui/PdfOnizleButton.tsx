"use client";

/**
 * src/components/ui/PdfOnizleButton.tsx
 * PDF önizleme butonu — tıklanınca PDF oluşturur ve modalı açar
 */

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfOnizlemeModal } from "@/components/ui/PdfOnizlemeModal";
import { toast } from "sonner";

interface Props {
  id?: string;
  baslik: string;
  dosyaAdi: string;
  label?: string;
  /** Async fonksiyon — blobUrl döndürmeli */
  onOlustur: () => Promise<string>;
  disabled?: boolean;
}

export function PdfOnizleButton({
  id,
  baslik,
  dosyaAdi,
  label = "PDF Önizle",
  onOlustur,
  disabled = false,
}: Props) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [modalAcik, setModalAcik] = useState(false);

  async function handleClick() {
    setModalAcik(true);
    setYukleniyor(true);
    setBlobUrl(null);
    try {
      const url = await onOlustur();
      setBlobUrl(url);
    } catch (err) {
      console.error(err);
      toast.error("PDF oluşturulurken hata oluştu.");
      setModalAcik(false);
    } finally {
      setYukleniyor(false);
    }
  }

  function handleKapat() {
    setModalAcik(false);
    setBlobUrl(null);
  }

  return (
    <>
      <Button
        id={id}
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled || yukleniyor}
        className="gap-1.5 text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-700"
      >
        {yukleniyor ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
        {label}
      </Button>

      {modalAcik && (
        <PdfOnizlemeModal
          blobUrl={blobUrl}
          yukleniyor={yukleniyor}
          baslik={baslik}
          dosyaAdi={dosyaAdi}
          onKapat={handleKapat}
        />
      )}
    </>
  );
}
