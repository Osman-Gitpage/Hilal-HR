import { redirect } from "next/navigation";

/** Gemiler sayfası kaldırıldı — belge listesine yönlendir */
export default function GemilerPage() {
  redirect("/cari");
}
