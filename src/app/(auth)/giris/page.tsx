import type { Metadata } from "next";
import { LoginForm } from "@/components/modules/auth/LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabınıza giriş yapın",
};

export default function GirisPage() {
  return <LoginForm />;
}
