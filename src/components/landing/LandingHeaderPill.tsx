"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Sparkles, LayoutDashboard, LogIn, ChevronRight } from "lucide-react";
import { LandingPwaButton } from "./LandingPwaButton";


export default function LandingHeaderPill() {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });

    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 flex justify-center">
      <div
        className={`w-full max-w-4xl rounded-full transition-all duration-300 px-5 py-2.5 flex items-center justify-between border ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl shadow-slate-200/50"
            : "bg-white/85 backdrop-blur-md border-slate-200/80 shadow-lg shadow-slate-200/30"
        }`}
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/test/logo.png"
            alt="Hilal Office Logo"
            width={140}
            height={40}
            className="h-9 md:h-11 lg:h-14 w-auto object-contain group-hover:opacity-90 transition-opacity"
            priority
          />
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-extrabold text-slate-600">
          <a href="#cozumler" className="hover:text-emerald-600 transition-colors">Modüller</a>
          <a href="#herkes-icin" className="hover:text-emerald-600 transition-colors">Sektörel Çözümler</a>
          <a href="#superpowers" className="hover:text-emerald-600 transition-colors">Özellikler</a>
          <a href="#referanslar" className="hover:text-emerald-600 transition-colors">Referanslar</a>
          <a href="#faq" className="hover:text-emerald-600 transition-colors">SSS</a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <LandingPwaButton variant="header" />
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-black bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-emerald-600 shadow-md transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Yönetim Paneli</span>
            </Link>
          ) : (
            <>
              <Link
                href="/giris"
                className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-full transition-colors hidden sm:block"
              >
                Giriş Yap
              </Link>
              <Link
                href="/giris"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <span>Demo İste</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
