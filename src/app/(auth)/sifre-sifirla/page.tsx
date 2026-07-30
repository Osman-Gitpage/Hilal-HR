"use client";

import { useActionState } from "react";
import { sifreSifirla } from "@/app/actions/auth";
import Link from "next/link";

type State = { hata?: string; basarili?: boolean } | undefined;

export default function SifreSifirlaPage() {
  const [state, action, pending] = useActionState<State, FormData>(sifreSifirla, undefined);

  return (
    <div className="flex flex-col gap-8">
      <div className="lg:hidden flex items-center gap-2.5">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-zinc-950 font-black text-sm leading-none">H</span>
        </div>
        <span className="text-white font-semibold tracking-tight">Hilal Office</span>
      </div>

      {state?.basarili ? (
        /* Başarı ekranı */
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14l5.5 5.5 10.5-10.5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">E-posta gönderildi</h1>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Şifre sıfırlama bağlantısı e-posta adresinize iletildi.
              Gelen kutunuzu kontrol edin.
            </p>
          </div>
          <Link href="/giris" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Giriş sayfasına dön
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Şifrenizi sıfırlayın</h1>
            <p className="text-sm text-zinc-500">
              Kayıtlı e-posta adresinize sıfırlama bağlantısı göndereceğiz.
            </p>
          </div>

          <form action={action} className="flex flex-col gap-5">
            {state?.hata && (
              <div className="flex items-start gap-3 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
                  <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5"/>
                  <path d="M8 5v3.5M8 11h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-sm text-red-400">{state.hata}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-zinc-300">E-posta</label>
              <input
                id="email" name="email" type="email" required
                placeholder="ornek@sirket.com" autoComplete="email"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors duration-200"
              />
            </div>

            <button type="submit" disabled={pending}
              className="w-full bg-white text-zinc-950 font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-100 transition-all duration-200 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {pending ? (
                <><svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/><path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>Gönderiliyor...</>
              ) : "Sıfırlama Bağlantısı Gönder"}
            </button>
          </form>

          <p className="text-sm text-zinc-500 text-center">
            <Link href="/giris" className="text-zinc-300 hover:text-white font-medium transition-colors inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Giriş sayfasına dön
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
