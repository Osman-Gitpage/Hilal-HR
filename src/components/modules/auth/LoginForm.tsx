"use client";

import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";
import Link from "next/link";

type Durum = { hata?: string } | undefined;

export function LoginForm() {
  const [durum, action, yukleniyor] = useActionState<Durum, FormData>(login, undefined);
  const [sifreGoster, setSifreGoster] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2.5">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-zinc-950 font-black text-sm leading-none">H</span>
        </div>
        <span className="text-white font-semibold tracking-tight">Hilal İK</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Tekrar hoş geldiniz</h1>
        <p className="text-sm text-zinc-500">Hesabınıza erişmek için bilgilerinizi girin</p>
      </div>

      {/* Form */}
      <form action={action} className="flex flex-col gap-5">
        {/* Error */}
        {durum?.hata && (
          <div className="flex items-start gap-3 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5"/>
              <path d="M8 5v3.5M8 11h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-sm text-red-400 leading-relaxed">{durum.hata}</span>
          </div>
        )}

        {/* E-posta */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-300">E-posta</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="ornek@sirket.com"
            required
            autoComplete="email"
            className={inputCls}
          />
        </div>

        {/* Şifre */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-zinc-300">Şifre</label>
            <Link href="/sifre-sifirla" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Şifremi Unuttum
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={sifreGoster ? "text" : "password"}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setSifreGoster((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={sifreGoster ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              {sifreGoster ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10.73 15.27A3 3 0 1 0 8.73 9.27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          id="btn-giris"
          type="submit"
          disabled={yukleniyor}
          className="w-full bg-white text-zinc-950 font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-100 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
        >
          {yukleniyor ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
                <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Giriş yapılıyor...
            </>
          ) : "Giriş Yap"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-zinc-600">veya</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      {/* Footer */}
      <p className="text-sm text-zinc-500 text-center">
        Hesabınız yok mu?{" "}
        <Link href="/kayit" className="text-zinc-300 hover:text-white font-medium transition-colors duration-200">
          Kayıt Ol
        </Link>
      </p>
    </div>
  );
}

const inputCls =
  "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors duration-200";
