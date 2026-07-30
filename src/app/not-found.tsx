import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Sayfa Bulunamadı | Hilal Office",
  description: "Aradığınız sayfa bulunamadı.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #3f3f46 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          opacity: 0.3,
        }}
        aria-hidden
      />

      {/* Top & bottom border lines */}
      <div className="absolute top-0 inset-x-0 h-px bg-zinc-800" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-zinc-800" />

      <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-lg">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="text-zinc-950 font-black text-base leading-none">H</span>
          </div>
          <span className="text-white font-semibold tracking-tight text-lg">Hilal Office</span>
        </Link>

        {/* 404 number */}
        <div
          className="text-[9rem] font-black leading-none tracking-tighter text-zinc-800 select-none"
          aria-hidden
        >
          404
        </div>

        {/* Message */}
        <div className="flex flex-col gap-3 -mt-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sayfa bulunamadı
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
            <br />
            Ana sayfaya dönerek devam edebilirsiniz.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white text-zinc-950 font-semibold px-6 py-2.5 rounded-xl hover:bg-zinc-100 transition-all duration-200 active:scale-95 text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300 font-medium px-6 py-2.5 rounded-xl hover:border-zinc-500 hover:text-white transition-all duration-200 text-sm"
          >
            Dashboard&apos;a Git
          </Link>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-zinc-800 pt-6">
          <p className="text-xs text-zinc-600">
            Sorun devam ederse{" "}
            <a href="mailto:destek@hilal.com.tr" className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">
              destek ekibimizle
            </a>{" "}
            iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
}
