"use client";

import { useActionState, useState } from "react";
import { profilGuncelle, sifreGuncelle, cikisYap } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

type State = { hata?: string; basarili?: boolean } | undefined;

const inputCls = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors duration-200";

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 py-8 border-b border-border last:border-0">
      <div className="md:w-64 shrink-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {desc && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>}
      </div>
      <div className="flex-1 max-w-md">{children}</div>
    </div>
  );
}

function Alert({ type, message }: { type: "error" | "success"; message: string }) {
  const isSuccess = type === "success";
  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border text-sm ${isSuccess ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/8 border-red-500/20 text-red-600 dark:text-red-400"}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
        {isSuccess
          ? <><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>
          : <><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
        }
      </svg>
      {message}
    </div>
  );
}

export function ProfilView({ email, adSoyad }: { email: string; adSoyad: string }) {
  const [profilState, profilAction, profilPending] = useActionState<State, FormData>(profilGuncelle, undefined);
  const [sifreState, sifreAction, sifrePending] = useActionState<State, FormData>(sifreGuncelle, undefined);
  const [sifreGoster, setSifreGoster] = useState(false);
  const [sifreGoster2, setSifreGoster2] = useState(false);

  return (
    <div className="max-w-3xl space-y-0">
      {/* Kişisel Bilgiler */}
      <Section title="Kişisel Bilgiler" desc="Adınız dashboard ve bildirimlerinde görünür.">
        <form action={profilAction} className="flex flex-col gap-4">
          {profilState?.hata && <Alert type="error" message={profilState.hata} />}
          {profilState?.basarili && <Alert type="success" message="Bilgileriniz güncellendi." />}

          <div className="flex flex-col gap-2">
            <label htmlFor="ad_soyad" className="text-sm font-medium">Ad Soyad</label>
            <input id="ad_soyad" name="ad_soyad" defaultValue={adSoyad} required className={inputCls} placeholder="Ahmet Yılmaz" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">E-posta</label>
            <input value={email} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
            <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez.</p>
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={profilPending} className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {profilPending && <svg className="animate-spin w-4 h-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/><path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
              Kaydet
            </button>
          </div>
        </form>
      </Section>

      {/* Şifre Değiştir */}
      <Section title="Şifre Değiştir" desc="Hesap güvenliğiniz için güçlü bir şifre kullanın.">
        <form action={sifreAction} className="flex flex-col gap-4">
          {sifreState?.hata && <Alert type="error" message={sifreState.hata} />}
          {sifreState?.basarili && <Alert type="success" message="Şifreniz başarıyla güncellendi." />}

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">Yeni Şifre</label>
            <div className="relative">
              <input id="password" name="password" type={sifreGoster ? "text" : "password"} minLength={8} required placeholder="En az 8 karakter" className={`${inputCls} pr-11`} />
              <button type="button" onClick={() => setSifreGoster(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <EyeIcon open={sifreGoster} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password2" className="text-sm font-medium">Şifreyi Tekrarlayın</label>
            <div className="relative">
              <input id="password2" type={sifreGoster2 ? "text" : "password"} minLength={8} required placeholder="Aynı şifreyi tekrar girin" className={`${inputCls} pr-11`} />
              <button type="button" onClick={() => setSifreGoster2(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <EyeIcon open={sifreGoster2} />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={sifrePending} className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {sifrePending && <svg className="animate-spin w-4 h-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/><path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
              Şifreyi Güncelle
            </button>
          </div>
        </form>
      </Section>

      {/* Hesap İşlemleri */}
      <Section title="Hesap İşlemleri" desc="Oturumu kapatmak için aşağıdaki butonu kullanın.">
        <button
          onClick={() => cikisYap()}
          className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-5 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </Section>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
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
  );
}
