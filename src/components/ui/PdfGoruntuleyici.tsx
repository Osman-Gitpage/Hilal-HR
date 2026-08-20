"use client";

/**
 * src/components/ui/PdfGoruntuleyici.tsx
 * Mobil ve masaüstü uyumlu PDF görüntüleyici — SSR güvenli dinamik sarmalayıcı
 */

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { PdfViewerCoreProps } from "./PdfViewerCore";

const DynamicPdfViewerCore = dynamic(
  () => import("./PdfViewerCore").then((mod) => mod.PdfViewerCore),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full w-full p-12 gap-3 text-muted-foreground bg-muted/10 min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">PDF görüntüleyici hazırlanıyor...</p>
      </div>
    ),
  }
);

export type PdfGoruntuleyiciProps = PdfViewerCoreProps;

export function PdfGoruntuleyici(props: PdfGoruntuleyiciProps) {
  return <DynamicPdfViewerCore {...props} />;
}
