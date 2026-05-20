"use client";

import { useActionState, useEffect } from "react";
import { sirketKur } from "@/app/actions/sirket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export function OnboardingForm() {
  const [state, action, isPending] = useActionState(sirketKur, undefined);

  useEffect(() => {
    if (state?.hata) toast.error(state.hata);
  }, [state]);

  return (
    <form action={action} className="space-y-5">
      {/* Şirket Adı */}
      <div className="space-y-1.5">
        <Label htmlFor="sirket_adi" className="text-white/90 text-sm font-medium">
          Şirket / İşletme Adı <span className="text-rose-400">*</span>
        </Label>
        <Input
          id="sirket_adi"
          name="sirket_adi"
          placeholder="Hilal İnşaat Ltd. Şti."
          required
          disabled={isPending}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
        />
      </div>

      {/* Vergi No */}
      <div className="space-y-1.5">
        <Label htmlFor="vergi_no" className="text-white/90 text-sm font-medium">
          Vergi Numarası
        </Label>
        <Input
          id="vergi_no"
          name="vergi_no"
          placeholder="1234567890"
          maxLength={11}
          disabled={isPending}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
        />
      </div>

      {/* Telefon */}
      <div className="space-y-1.5">
        <Label htmlFor="onb-telefon" className="text-white/90 text-sm font-medium">
          Telefon
        </Label>
        <Input
          id="onb-telefon"
          name="telefon"
          type="tel"
          placeholder="0212 000 00 00"
          disabled={isPending}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
        />
      </div>

      {/* E-posta */}
      <div className="space-y-1.5">
        <Label htmlFor="onb-email" className="text-white/90 text-sm font-medium">
          Şirket E-postası
        </Label>
        <Input
          id="onb-email"
          name="email"
          type="email"
          placeholder="info@siirket.com"
          disabled={isPending}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
        />
      </div>

      {state?.hata && (
        <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          {state.hata}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        id="btn-sirket-kur"
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold h-11 mt-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-2" />
        )}
        {isPending ? "Oluşturuluyor..." : "Şirketi Kur ve Devam Et"}
      </Button>
    </form>
  );
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Kart */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* İkon + Başlık */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
              <Building2 className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Şirketinizi Kurun
            </h1>
            <p className="text-white/50 mt-2 text-sm">
              Sistemi kullanmaya başlamak için şirket bilgilerinizi girin.
            </p>
          </div>

          {/* Adım göstergesi */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-1 rounded-full bg-green-500" />
            <div className="flex-1 h-1 rounded-full bg-blue-500" />
            <div className="flex-1 h-1 rounded-full bg-white/10" />
          </div>
          <p className="text-xs text-white/40 text-center mb-6 -mt-4">
            Adım 2 / 3 — Şirket Bilgileri
          </p>

          <OnboardingForm />
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Hilal HR · Şirket kurulum sihirbazı
        </p>
      </div>
    </div>
  );
}
