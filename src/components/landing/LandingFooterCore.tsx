"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUp } from "lucide-react";


export default function LandingFooterCore() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200/80 relative z-10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200/80">
          
          {/* Brand */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/test/logo.png"
                alt="Hilal Office Logo"
                width={160}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm font-normal">
              Çok firmalı holding, tersane, şantiye ve KOBİ&apos;ler için tasarlanmış modern insan kaynakları, bordro, puantaj ve evrak yönetim platformu.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-800 font-mono text-[11px]">Sistem Durumu: Servisler Aktif (%99.99 Uptime)</span>
            </div>
          </div>

          {/* Links 1 */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">Çözümler</span>
            <ul className="flex flex-col gap-2 text-xs font-semibold">
              <li><a href="#cozumler" className="hover:text-emerald-600 transition-colors">Personel & Özlük</a></li>
              <li><a href="#cozumler" className="hover:text-emerald-600 transition-colors">Bordro & Puantaj</a></li>
              <li><a href="#cozumler" className="hover:text-emerald-600 transition-colors">Şirket & Evrak Deposu</a></li>
              <li><a href="#cozumler" className="hover:text-emerald-600 transition-colors">Çoklu Şirket Mimarisi</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">Platform</span>
            <ul className="flex flex-col gap-2 text-xs font-semibold">
              <li><a href="#herkes-icin" className="hover:text-emerald-600 transition-colors">Herkes İçin Tasarlandı</a></li>
              <li><a href="#referanslar" className="hover:text-emerald-600 transition-colors">Referanslar</a></li>
              <li><a href="#faq" className="hover:text-emerald-600 transition-colors">SSS</a></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">Yasal & KVKK</span>
            <ul className="flex flex-col gap-2 text-xs font-semibold">
              <li><Link href="/giris" className="hover:text-emerald-600 transition-colors">Giriş Yap / Üye Ol</Link></li>
              <li><span className="cursor-pointer hover:text-emerald-600 transition-colors">KVKK Metni</span></li>
              <li><span className="cursor-pointer hover:text-emerald-600 transition-colors">Gizlilik Politikası</span></li>
              <li><span className="cursor-pointer hover:text-emerald-600 transition-colors">Kullanım Şartları</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div>© {new Date().getFullYear()} Hilal Office. Tüm hakları saklıdır.</div>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-full transition-colors font-bold"
          >
            <span>Yukarı Çık</span>
            <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>

      </div>
    </footer>
  );
}
