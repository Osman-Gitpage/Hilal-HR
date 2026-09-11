import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hilal Tevzi Formu",
  description: "Günlük Tevzi ve Personel Dağıtım Formu",
  manifest: "/api/manifest-tevzi",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hilal Tevzi",
  },
};

export default function HilalTevziLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
