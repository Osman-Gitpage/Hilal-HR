import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/modules/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Şirket Kurulumu | Hilal Office",
  description: "Şirketinizi kurun ve sistemi kullanmaya başlayın.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
