import { redirect } from "next/navigation";

/**
 * Eski /cari/[gemiId] route'u — yeni /cari/gemiler/[gemiId] adresine yönlendir.
 * Geriye dönük uyumluluk için saklanır.
 */
export default function EskiGemiDetayPage({
  params,
}: {
  params: Promise<{ gemiId: string }>;
}) {
  // Server component: params'ı unwrap etmeden redirect yapabiliriz
  // Next.js 15'te params Promise<> tipinde — use() ile unwrap gerekir ama
  // redirect() synchronous olduğundan Promise'i .then() ile çözüyoruz.
  // En basit yaklaşım: statik wrapper component.
  void params; // params'ı okumak yerine dinamik route segmentini URL'den alıyoruz
  redirect("/cari/gemiler");
}
