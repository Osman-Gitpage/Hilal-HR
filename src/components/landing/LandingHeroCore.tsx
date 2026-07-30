"use client";

import Link from "next/link";
import { Check, Lightbulb, ShieldCheck, Eye, Sparkles, FileCheck2, ArrowRight, Building2 } from "lucide-react";

export default function LandingHeroCore() {
  return (
    <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 bg-[#F8F9FB] overflow-hidden">
      
      {/* Background Soft Emerald Ambient Light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Top Node Diagram & Central 3D App Icon (Emerald Theme) */}
        <div className="flex flex-col items-center justify-center mb-8 relative">
          
          {/* Connecting Line SVG Backdrop */}
          <svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[120px] pointer-events-none hidden sm:block opacity-40"
            viewBox="0 0 600 120"
            fill="none"
          >
            <path
              d="M50 60 C 150 20, 200 60, 300 60 C 400 60, 450 20, 550 60"
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <circle cx="150" cy="40" r="4" fill="#059669" className="animate-pulse" />
            <circle cx="450" cy="40" r="4" fill="#059669" className="animate-pulse" />
          </svg>

          {/* Node Badges Cluster with Animated Float */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 relative z-10">
            
            {/* Left Node 1: Amber Lightbulb (Animated Float) */}
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-400/30 -rotate-6 hover:rotate-0 transition-transform animate-float-slow">
              <Lightbulb className="w-6 h-6 fill-current" />
            </div>

            {/* Left Node 2: Teal Sparkles */}
            <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 rotate-3 hover:rotate-0 transition-transform hidden sm:flex animate-float-delayed">
              <Sparkles className="w-6 h-6" />
            </div>

            {/* Central Main 3D App Badge (Emerald Checkmark with Glow Pulse) */}
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/40 border-4 border-white transform hover:scale-110 transition-transform duration-300 animate-glow-pulse">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Check className="w-6 h-6 text-white stroke-[3]" />
              </div>
            </div>

            {/* Right Node 1: Indigo Shield */}
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 rotate-6 hover:rotate-0 transition-transform animate-float-slow">
              <ShieldCheck className="w-6 h-6" />
            </div>

            {/* Right Node 2: White Eye Badge */}
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center shadow-lg -rotate-3 hover:rotate-0 transition-transform hidden sm:flex animate-float-delayed">
              <Eye className="w-6 h-6 text-emerald-600" />
            </div>

          </div>
        </div>

        {/* Central Main Title & Copy Tailored to Hilal HR */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-5">
          
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tersane, Şantiye & Çoklu Şirket İK Platformu</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
            Tüm İK, Bordro ve Özlük Süreçleri{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Tek Platformda
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
            Tersane ve şantiye özlük paketlerini saniyeler içinde otomatik üretin. Geriye dönük ezilmeyen versiyonlu bordro (v1, v2) ve 31 günlük puantaj matrisi ile sıfır hatayla çalışın.
          </p>

          {/* Primary Action Button (Emerald Gradient Pill) */}
          <div className="pt-2">
            <Link
              href="/giris"
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold px-8 py-4 rounded-full shadow-xl shadow-emerald-600/30 transition-all duration-200 text-base active:scale-95 hover:shadow-2xl"
            >
              <span>Hemen Ücretsiz Deneyin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* Floating Cards (Hilal HR Real System Personnel Roles) */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          
          {/* Card 1 */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xl shadow-slate-200/60 flex flex-col items-center text-center gap-3 hover:-translate-y-2 hover:border-emerald-300 transition-all duration-300 animate-float-slow">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center text-sm shadow-md">
              SY
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900">Selin Yılmaz</div>
              <div className="text-[10px] text-slate-500 font-semibold">İK Direktörü</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xl shadow-slate-200/60 flex flex-col items-center text-center gap-3 hover:-translate-y-2 hover:border-emerald-300 transition-all duration-300 animate-float-delayed">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 text-emerald-400 font-black flex items-center justify-center text-sm shadow-md">
              AY
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900">Ahmet Yılmaz</div>
              <div className="text-[10px] text-slate-500 font-semibold">Kıdemli Kaynakçı</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xl shadow-slate-200/60 flex flex-col items-center text-center gap-3 hover:-translate-y-2 hover:border-emerald-300 transition-all duration-300 animate-float-slow">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
              FK
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900">Fatma Kaya</div>
              <div className="text-[10px] text-slate-500 font-semibold">İSG Uzmanı</div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xl shadow-slate-200/60 flex flex-col items-center text-center gap-3 hover:-translate-y-2 hover:border-emerald-300 transition-all duration-300 animate-float-delayed">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-slate-900 text-white font-black flex items-center justify-center text-sm shadow-md">
              MD
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900">Mehmet Demir</div>
              <div className="text-[10px] text-slate-500 font-semibold">Şantiye Şefi</div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xl shadow-slate-200/60 flex flex-col items-center text-center gap-3 hover:-translate-y-2 hover:border-emerald-300 transition-all duration-300 animate-float-slow">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-md">
              EO
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900">Elif Öztürk</div>
              <div className="text-[10px] text-slate-500 font-semibold">Mali Uzman</div>
            </div>
          </div>

          {/* Card 6 */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xl shadow-slate-200/60 flex flex-col items-center text-center gap-3 hover:-translate-y-2 hover:border-emerald-300 transition-all duration-300 animate-float-delayed">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-teal-700 text-white font-black flex items-center justify-center text-sm shadow-md">
              CT
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900">Cem Toker</div>
              <div className="text-[10px] text-slate-500 font-semibold">Montaj Ustası</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
