import LandingHeaderPill from "@/components/landing/LandingHeaderPill";
import LandingHeroCore from "@/components/landing/LandingHeroCore";
import LandingRolesGrid from "@/components/landing/LandingRolesGrid";
import LandingAllInOne from "@/components/landing/LandingAllInOne";
import LandingTestimonialsCore from "@/components/landing/LandingTestimonialsCore";
import LandingFaqCore from "@/components/landing/LandingFaqCore";
import LandingCtaCore from "@/components/landing/LandingCtaCore";
import LandingFooterCore from "@/components/landing/LandingFooterCore";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hilal Office - Muhasebe ve İnsan Kaynakları",
  description:
    "Core HR Çözümleri. Çok firmalı yapıyı tek bulut platformunda yönetin. Personel özlük takibi, otomatik bordro, puantaj ve dijital evrak kasası.",
};

export default function HomePage() {
  return (
    <div className="bg-[#F8F9FB] text-slate-900 min-h-screen font-sans selection:bg-purple-500 selection:text-white antialiased">
      <LandingHeaderPill />
      <main>
        <LandingHeroCore />
        <LandingRolesGrid />
        <LandingAllInOne />
        <LandingTestimonialsCore />
        <LandingFaqCore />
        <LandingCtaCore />
      </main>
      <LandingFooterCore />
    </div>
  );
}
