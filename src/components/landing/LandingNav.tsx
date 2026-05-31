"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);

    // Kullanıcı oturumu kontrol et
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });

    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { href: "#ozellikler", label: "Özellikler" },
    { href: "#moduller", label: "Modüller" },
    { href: "#istatistikler", label: "İstatistikler" },
    { href: "#referanslar", label: "Referanslar" },
  ];

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-zinc-950 font-black text-sm leading-none">H</span>
          </div>
          <span className="text-white font-semibold tracking-tight">Hilal İK</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm bg-white text-zinc-950 font-medium px-4 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors duration-200"
            >
              Dashboard&apos;a Git
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ) : (
            <>
              <Link
                href="/giris"
                className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 px-3 py-1.5"
              >
                Giriş Yap
              </Link>
              <Link
                href="/giris"
                className="text-sm bg-white text-zinc-950 font-medium px-4 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors duration-200"
              >
                Başlayın
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Menü"
        >
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="text-sm bg-white text-zinc-950 font-medium px-4 py-2 rounded-lg text-center hover:bg-zinc-100 transition-colors"
              >
                Dashboard&apos;a Git
              </Link>
            ) : (
              <>
                <Link href="/giris" className="text-sm text-zinc-400 hover:text-white transition-colors">Giriş Yap</Link>
                <Link
                  href="/giris"
                  className="text-sm bg-white text-zinc-950 font-medium px-4 py-2 rounded-lg text-center hover:bg-zinc-100 transition-colors"
                >
                  Başlayın
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
