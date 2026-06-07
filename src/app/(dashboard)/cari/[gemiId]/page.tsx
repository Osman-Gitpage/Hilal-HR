import { redirect } from "next/navigation";

/**
 * Eski /cari/[gemiId] route'u — artık /cari'ye yönlendir.
 */
export default function EskiGemiDetayPage() {
  redirect("/cari");
}
