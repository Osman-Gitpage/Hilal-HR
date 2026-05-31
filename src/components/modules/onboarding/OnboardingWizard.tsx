"use client";

import { useState, useEffect, useActionState } from "react";
import { sirketKurVeTamamla } from "@/app/actions/sirket";
import Link from "next/link";

type ActionState = { hata?: string; basarili?: boolean } | undefined;

const SEHIRLER = [
  "Adana","Ankara","Antalya","Bursa","Diyarbakır","Eskişehir","Gaziantep",
  "İstanbul","İzmir","Kayseri","Kocaeli","Konya","Mersin","Samsun","Trabzon",
  "Diğer",
];

const STEPS = [
  { no: 1, label: "Şirket Bilgileri" },
  { no: 2, label: "Çalışma Ayarları" },
  { no: 3, label: "Hazır!" },
];

/* ── Sol panel: her adım için farklı içerik ─────────────────────── */
function LeftPanel({ step }: { step: number }) {
  const content = [
    {
      eyebrow: "Adım 1 / 3",
      title: "Şirketinizi\nkayıt altına alın",
      desc: "Sistemi kullanmaya başlamak için şirketinizin temel bilgilerini girin. Bu bilgiler bordro ve raporlarda kullanılacaktır.",
    },
    {
      eyebrow: "Adım 2 / 3",
      title: "Çalışma\ndüzeninizi belirleyin",
      desc: "Günlük çalışma saati ve haftalık düzeniniz, bordro hesaplamalarını ve puantaj takibini doğrudan etkiler.",
    },
    {
      eyebrow: "Tamamlandı 🎉",
      title: "Her şey\nhazır!",
      desc: "Şirketiniz kuruldu, çalışma ayarları kaydedildi. Artık personel ekleyebilir ve bordro işlemlerinizi başlatabilirsiniz.",
    },
  ][step - 1];

  return (
    <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 border-r border-zinc-800 relative overflow-hidden shrink-0">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #3f3f46 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          opacity: 0.3,
        }}
        aria-hidden
      />

      {/* Logo */}
      <a href="/" className="relative z-10 flex items-center gap-3 self-start">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
          <span className="text-zinc-950 font-black text-base leading-none">H</span>
        </div>
        <span className="text-white font-semibold tracking-tight text-lg">Hilal İK</span>
      </a>

      {/* Step indicators */}
      <div className="relative z-10 flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          {STEPS.map((s) => {
            const done = step > s.no;
            const active = step === s.no;
            return (
              <div key={s.no} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 ${
                    done
                      ? "bg-emerald-400 text-zinc-950"
                      : active
                      ? "bg-white text-zinc-950"
                      : "bg-zinc-800 text-zinc-600"
                  }`}
                >
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    s.no
                  )}
                </div>
                <span className={`text-sm font-medium transition-colors duration-300 ${active ? "text-white" : done ? "text-zinc-400" : "text-zinc-600"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dynamic content */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold text-zinc-500 tracking-widest uppercase">{content.eyebrow}</div>
          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight whitespace-pre-line">{content.title}</h2>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">{content.desc}</p>
        </div>
      </div>

      <div className="relative z-10 text-xs text-zinc-700">
        © {new Date().getFullYear()} Hilal İK. Tüm hakları saklıdır.
      </div>
    </div>
  );
}

/* ── Ana wizard bileşeni ─────────────────────────────────────────── */
export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [sirketData, setSirketData] = useState({
    sirket_adi: "", vergi_no: "", telefon: "", email: "", sehir: "",
  });

  const [state, submitAction, isPending] = useActionState<ActionState, FormData>(
    sirketKurVeTamamla,
    undefined
  );

  // Başarılı kayıt → 3. adıma geç
  useEffect(() => {
    if (state?.basarili) setStep(3);
  }, [state?.basarili]);

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <LeftPanel step={step} />

      {/* Sağ panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">

          {/* Mobil logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-zinc-950 font-black text-sm leading-none">H</span>
            </div>
            <span className="text-white font-semibold tracking-tight">Hilal İK</span>
          </div>

          {/* Mobil step dots */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            {STEPS.map((s) => (
              <div
                key={s.no}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s.no ? "w-6 bg-white" : step > s.no ? "w-4 bg-emerald-400" : "w-4 bg-zinc-700"
                }`}
              />
            ))}
          </div>

          {/* ── Adım 1: Şirket Bilgileri ── */}
          {step === 1 && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Şirket bilgileri</h1>
                <p className="text-sm text-zinc-500">Sadece şirket adı zorunludur, diğerleri isteğe bağlı.</p>
              </div>

              <div className="flex flex-col gap-5">
                <Field label="Şirket / İşletme Adı" required>
                  <input
                    value={sirketData.sirket_adi}
                    onChange={(e) => setSirketData((p) => ({ ...p, sirket_adi: e.target.value }))}
                    placeholder="Hilal İnşaat Ltd. Şti."
                    className={inputCls}
                  />
                </Field>

                <Field label="Vergi Numarası">
                  <input
                    value={sirketData.vergi_no}
                    onChange={(e) => setSirketData((p) => ({ ...p, vergi_no: e.target.value }))}
                    placeholder="1234567890"
                    maxLength={11}
                    className={inputCls}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Telefon">
                    <input
                      value={sirketData.telefon}
                      onChange={(e) => setSirketData((p) => ({ ...p, telefon: e.target.value }))}
                      placeholder="0212 000 00 00"
                      type="tel"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Şehir">
                    <select
                      value={sirketData.sehir}
                      onChange={(e) => setSirketData((p) => ({ ...p, sehir: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">Seçin</option>
                      {SEHIRLER.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Şirket E-postası">
                  <input
                    value={sirketData.email}
                    onChange={(e) => setSirketData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="info@sirket.com"
                    type="email"
                    className={inputCls}
                  />
                </Field>

                <button
                  onClick={() => {
                    if (!sirketData.sirket_adi.trim()) return;
                    setStep(2);
                  }}
                  className="w-full bg-white text-zinc-950 font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-100 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 mt-1"
                >
                  Devam Et
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {!sirketData.sirket_adi.trim() && (
                  <p className="text-xs text-zinc-600 text-center -mt-2">Şirket adı girilmeden devam edilemez</p>
                )}
              </div>
            </div>
          )}

          {/* ── Adım 2: Çalışma Ayarları ── */}
          {step === 2 && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Çalışma ayarları</h1>
                <p className="text-sm text-zinc-500">Bordro ve puantaj hesaplamalarında kullanılır. Sonradan değiştirilebilir.</p>
              </div>

              <form
                action={(fd) => {
                  // Adım 1 verilerini hidden input olarak ekle
                  fd.set("sirket_adi", sirketData.sirket_adi);
                  fd.set("vergi_no", sirketData.vergi_no);
                  fd.set("telefon", sirketData.telefon);
                  fd.set("email", sirketData.email);
                  fd.set("sehir", sirketData.sehir);
                  submitAction(fd);
                }}
                className="flex flex-col gap-5"
              >
                {state?.hata && (
                  <div className="flex items-start gap-3 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
                      <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5"/>
                      <path d="M8 5v3.5M8 11h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-sm text-red-400">{state.hata}</span>
                  </div>
                )}

                {/* Günlük çalışma saati */}
                <Field label="Günlük Çalışma Saati">
                  <input
                    name="gunluk_saat"
                    type="number"
                    defaultValue={8}
                    min={1}
                    max={24}
                    step={0.5}
                    className={inputCls}
                    required
                  />
                </Field>

                {/* Haftalık çalışma düzeni */}
                <Field label="Haftalık Çalışma Düzeni">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "5", label: "Pzt – Cum", sub: "5 gün · 22 iş günü/ay" },
                      { value: "6", label: "Pzt – Cmt", sub: "6 gün · 26 iş günü/ay" },
                    ].map((opt) => (
                      <label key={opt.value} className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="haftalik_gun"
                          value={opt.value}
                          defaultChecked={opt.value === "5"}
                          className="peer sr-only"
                        />
                        <div className="border border-zinc-800 rounded-xl p-3 peer-checked:border-white peer-checked:bg-white/5 transition-all duration-200">
                          <div className="text-sm font-semibold text-white">{opt.label}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{opt.sub}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </Field>

                {/* Info box */}
                <div className="flex gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5 text-zinc-500">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 7v4M8 5.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Aylık çalışma saati otomatik hesaplanır. Ayarlar &gt; Çalışma Saatleri menüsünden istediğiniz zaman güncelleyebilirsiniz.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-zinc-700 text-zinc-300 font-medium py-2.5 rounded-xl text-sm hover:border-zinc-500 hover:text-white transition-all duration-200"
                  >
                    Geri
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-white text-zinc-950 font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-100 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
                          <path d="M12 7a5 5 0 0 0-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Kaydediliyor...
                      </>
                    ) : "Tamamla"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Adım 3: Tamamlandı ── */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center gap-8">
              {/* Success icon */}
              <div className="w-20 h-20 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M7 18l8 8 14-14" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Şirketiniz hazır!</h1>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Kurulum tamamlandı. Artık personel ekleyebilir,
                  puantaj ve bordro işlemlerinizi yönetebilirsiniz.
                </p>
              </div>

              {/* Özet */}
              <div className="w-full border border-zinc-800 rounded-xl divide-y divide-zinc-800">
                {[
                  { label: "Şirket", value: sirketData.sirket_adi },
                  { label: "Şehir", value: sirketData.sehir || "—" },
                  { label: "Çalışma ayarları", value: "Kaydedildi ✓" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-zinc-500">{r.label}</span>
                    <span className="text-sm font-medium text-white">{r.value}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard"
                className="w-full bg-white text-zinc-950 font-semibold py-3 rounded-xl text-sm hover:bg-zinc-100 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                Dashboard&apos;a Git
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Yardımcı alt bileşenler ─────────────────────────────────────── */
const inputCls =
  "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors duration-200";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
