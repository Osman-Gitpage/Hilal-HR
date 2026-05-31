"use client";

import { useActionState, useState } from "react";
import { sifreGuncelle } from "@/app/actions/auth";
import Link from "next/link";

type State = { hata?: string; basarili?: boolean } | undefined;

export default function SifreGuncellePage() {
  const [state, action, pending] = useActionState<State, FormData>(sifreGuncelle, undefined);
  const [goster, setGoster] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="lg:hidden flex items-center gap-2.5">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-zinc-950 font-black text-sm leading-none">H</span>
        </div>
        <span className="text-white font-semibold tracking-tight">Hilal İK</span>
      </div>

      {state?.basarili ? (
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14l5.5 5.5 10.5-10.5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Şifre güncellendi</h1>
            <p className="text-sm text-zinc-500">Yeni şifrenizle giriş yapabilirsiniz.</p>
          </div>
          <Link href="/giris"
            className="w-full bg-white text-zinc-950 font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-100 transition-all duration-200 text-center"
          >
            Giriş Yap
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Yeni şifre belirleyin</h1>
            <p className="text-sm text-zinc-500">En az 8 karakter içeren güçlü bir şifre seçin.</p>
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
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">Yeni Şifre</label>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={goster ? "text" : "password"}
                  minLength={8} required placeholder="En az 8 karakter"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 pr-11 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors"
                />
                <button type="button" onClick={() => setGoster(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {goster
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10.73 15.27A3 3 0 1 0 8.73 9.27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" disabled={pending}
              className="w-full bg-white text-zinc-950 font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-100 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {pending
                ? <><svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/><path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>Kaydediliyor...</>
                : "Şifreyi Güncelle"
              }
            </button>
          </form>
        </>
      )}
    </div>
  );
}
