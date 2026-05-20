import type { Metadata } from "next";
import { KayitForm } from "@/components/modules/auth/KayitForm";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Yeni hesap oluşturun",
};

export default function KayitPage() {
  return <KayitForm />;
}
