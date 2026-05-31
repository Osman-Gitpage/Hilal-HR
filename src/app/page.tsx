import LandingHero from "@/components/landing/LandingHero";
import LandingNav from "@/components/landing/LandingNav";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingModules from "@/components/landing/LandingModules";
import LandingStats from "@/components/landing/LandingStats";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hilal İK — İnsan Kaynakları & Bordro Yönetim Sistemi",
  description:
    "Çok firmalı yapıyı tek platformdan yönetin. Personel, bordro, puantaj ve cari hesap modülleriyle eksiksiz İK yönetimi.",
};

export default function HomePage() {
  return (
    <div className="bg-zinc-950 text-white min-h-screen">
      <LandingNav />
      <LandingHero />
      <LandingStats />
      <LandingFeatures />
      <LandingModules />
      <LandingTestimonials />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
