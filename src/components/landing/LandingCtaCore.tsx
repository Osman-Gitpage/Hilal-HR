"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function LandingCtaCore() {
  return (
    <section className="py-24 sm:py-32 bg-[#F8F9FB] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-[40px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-10 sm:p-20 text-center shadow-2xl overflow-hidden border border-slate-800">
          
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-extrabold text-emerald-400 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>14 Gün Ücretsiz Deneme — Kredi Kartı Gerekmez</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
              İnsan Kaynaklarınızı Bugün{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Merkezileştirin
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
              Dakikalar içinde hesabınızı oluşturun, şirketlerinizi ve personellerinizi tanımlayın. Şeffaf ve modern İK yönetiminin keyfini çıkarın.
            </p>

            <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
              <Link
                href="/giris"
                className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold px-8 py-4 rounded-full shadow-xl shadow-emerald-600/30 transition-all text-base active:scale-95"
              >
                <span>Hemen Demo İsteyin</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Anında Canlı Destek</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Taahhütsüz İptal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ücretsiz Veri Taşıma Desteği</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
