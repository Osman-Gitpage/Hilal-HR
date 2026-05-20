import type { Metadata } from "next";
import { BelgeFormView } from "@/components/modules/cari/BelgeFormView";

export const metadata: Metadata = { title: "Belge Düzenle — Cari" };

export default function BelgeDuzenlePage({
  params,
}: {
  params: Promise<{ belgeId: string }>;
}) {
  return <BelgeFormView mod="duzenle" belgeIdPromise={params} />;
}
