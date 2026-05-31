"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function LandingHero() {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!spotRef.current) return;
      spotRef.current.style.left = `${e.clientX}px`;
      spotRef.current.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #3f3f46 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
        aria-hidden
      />

      {/* Mouse spotlight */}
      <div
        ref={spotRef}
        className="pointer-events-none fixed w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full z-0"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Top border line */}
      <div className="absolute top-0 inset-x-0 h-px bg-zinc-800" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — copy */}
        <div className="flex flex-col gap-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-start border border-zinc-800 rounded-full px-3.5 py-1.5 text-xs text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Türkiye&apos;nin Modern İK Platformu
          </div>

          {/* Heading */}
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
            İnsan Kaynaklarını
            <br />
            <span className="text-zinc-400">Tek Çatı Altında</span>
            <br />
            Yönetin
          </h1>

          {/* Sub */}
          <p className="text-base text-zinc-400 leading-relaxed max-w-lg">
            Personel takibi, bordro hesaplama, puantaj ve cari hesapları
            çok firmalı yapıda tek platformdan eksiksiz yönetin.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/giris"
              className="inline-flex items-center gap-2 bg-white text-zinc-950 font-semibold px-6 py-3 rounded-xl hover:bg-zinc-100 transition-all duration-200 active:scale-95"
            >
              Hemen Başlayın
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a
              href="#moduller"
              className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300 font-medium px-6 py-3 rounded-xl hover:border-zinc-500 hover:text-white transition-all duration-200"
            >
              Modülleri Keşfet
            </a>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2">
            {["Ücretsiz Kurulum", "7/24 Destek", "KVKK Uyumlu"].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7l3 3 6-6" stroke="#34c78a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Dashboard mockup */}
        <div className="hidden lg:block">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl">
            {/* Window bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
              <span className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="flex-1 text-center text-xs text-zinc-600">Hilal İK — Dashboard</span>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Toplam Personel", value: "248", icon: "👥" },
                  { label: "Bu Ay Bordro", value: "₺1.2M", icon: "💰" },
                  { label: "Aktif Firma", value: "12", icon: "🏢" },
                ].map((s, i) => (
                  <div key={i} className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3">
                    <div className="text-lg mb-1">{s.icon}</div>
                    <div className="text-white font-bold text-lg leading-none">{s.value}</div>
                    <div className="text-zinc-500 text-xs mt-1 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4">
                <div className="text-xs text-zinc-400 font-medium mb-3">Aylık Bordro Trendi</div>
                <div className="flex items-end gap-1 h-20">
                  {[45, 62, 55, 78, 66, 88, 72, 95, 80, 100, 87, 92].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-zinc-600 hover:bg-zinc-400 transition-colors duration-200"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl overflow-hidden">
                {["Ahmet Yılmaz", "Fatma Kaya", "Mehmet Demir"].map((name, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i < 2 ? "border-b border-zinc-700/50" : ""}`}>
                    <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
                      {name[0]}
                    </div>
                    <span className="text-sm text-zinc-300 flex-1">{name}</span>
                    <span className="text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-zinc-800" />
    </section>
  );
}
