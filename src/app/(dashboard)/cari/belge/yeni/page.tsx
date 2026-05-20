import type { Metadata } from "next";
import { BelgeFormView } from "@/components/modules/cari/BelgeFormView";

export const metadata: Metadata = { title: "Yeni Belge — Cari" };

export default function BelgeYeniPage({
  searchParams,
}: {
  searchParams: Promise<{ gemiId?: string; tur?: string }>;
}) {
  return <BelgeFormView mod="yeni" searchParamsPromise={searchParams} />;
}
