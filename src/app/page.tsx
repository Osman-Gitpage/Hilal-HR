"use client";

// ─── Imports ───────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";

// ─── Tipler ────────────────────────────────────────────────────────────────
type Tema = "light" | "dark";

interface Modul {
  ikon: React.ReactNode;
  baslik: string;
  aciklama: string;
  etiket: string;
  vurgu?: boolean;
}

// ─── İçerik Sözlüğü ────────────────────────────────────────────────────────
const icerik = {
  marka: {
    ad: "HİLAL OFFİCE",
    baslik: "İK & Bordroyu\nKolaylaştırıyoruz.",
    altBaslik:
      "Çok şirketi tek ekrandan yönetin. Bordro, puantaj, personel özlük ve belgeler — hepsi bir arada, sıfır karmaşa.",
    birincilCta: "Ücretsiz Dene",
    ikincilCta: "Nasıl Çalışır?",
  },
  nav: {
    linkler: [
      { etiket: "Özellikler", hedef: "#ozellikler" },
      { etiket: "Çözümler", hedef: "#cozumler" },
      { etiket: "Fiyatlandırma", hedef: "#fiyatlandirma" },
      { etiket: "İletişim", hedef: "#iletisim" },
    ],
    girisYap: "Giriş Yap",
  },
  fark: [
    {
      no: "01",
      baslik: "Saniyeler içinde kurulum",
      aciklama: "Yazılım yüklemesi yok. Tarayıcıyı aç, giriş yap, çalışmaya başla.",
    },
    {
      no: "02",
      baslik: "Sınırsız şirket profili",
      aciklama: "Holding, grup şirket veya bayilik yapısı — tek hesaptan tam kontrol.",
    },
    {
      no: "03",
      baslik: "Yasal güncellemeler otomatik",
      aciklama: "SGK prim oranları, asgari ücret ve vergi değişiklikleri anında uygulanır.",
    },
  ],
  moduller: [
    {
      ikon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      etiket: "Personel",
      baslik: "Çok Firmalı Personel Yönetimi",
      aciklama:
        "Onlarca şirketin tüm çalışanlarını tek panelden takip edin. Özlük dosyaları, sözleşmeler ve belgeler dijital kasanızda.",
      vurgu: true,
    },
    {
      ikon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      etiket: "Bordro",
      baslik: "Akıllı Bordro Motoru",
      aciklama:
        "SGK, gelir vergisi ve damga vergisi hesaplamalarını otomatikleştirin. Bordro süreci dakikalar içinde tamamlanır.",
    },
    {
      ikon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
      etiket: "Puantaj",
      baslik: "Gerçek Zamanlı Puantaj",
      aciklama:
        "Devamsızlık, izin ve fazla mesai takibini anlık yapın. Bordro ile senkronize — manuel aktarım yok.",
    },
    {
      ikon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      ),
      etiket: "Belgeler",
      baslik: "Belge & Rapor Üretimi",
      aciklama:
        "PDF, Excel ve Word şablonlarıyla kurumsal raporları tek tıkla oluşturun. Bordro bordrosu, hizmet dökümü ve daha fazlası.",
    },
    {
      ikon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      etiket: "Cari",
      baslik: "Cari Hesap Takibi",
      aciklama:
        "Tedarikçi ve müşteri cari hesaplarını bordro süreçlerinizle entegre edin. Bakiye takibi, hareket analizi anlık.",
    },
    {
      ikon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      etiket: "Güvenlik",
      baslik: "Kurumsal Güvenlik Katmanı",
      aciklama:
        "Row-Level Security ile her kullanıcı yalnızca kendi yetkisindeki veriyi görür. KVKK uyumlu, tam denetim kaydı.",
    },
  ] satisfies Modul[],
  tanitim: {
    baslik: "HİLAL OFFİCE İLE TANIŞIN",
    metin:
      "Muhasebe ve İK yazılımlarının karmaşıklığına son verin. Hilal Office; sezgisel tasarımı, anlık hesaplamaları ve sıfır kurulum gerektiren bulut mimarisiyle her ölçekteki işletmeye enterprise düzeyde İK yönetimi sunuyor. Tek platform, tam kontrol.",
  },
  footer: {
    telif: `© ${new Date().getFullYear()} Hilal Office. Tüm hakları saklıdır.`,
    gizlilik: "Gizlilik Politikası",
    kullanim: "Kullanım Şartları",
    kvkk: "KVKK",
  },
} as const;

// ─── Yardımcı ──────────────────────────────────────────────────────────────
function baslangicTemasiniHesapla(): Tema {
  if (typeof window === "undefined") return "dark";
  const kayitli = localStorage.getItem("hilal-tema") as Tema | null;
  if (kayitli === "light" || kayitli === "dark") return kayitli;
  const saat = new Date().getHours();
  return saat >= 7 && saat < 19 ? "light" : "dark";
}

// ─── NavBar ────────────────────────────────────────────────────────────────
function NavBar({ tema, temaToggle }: { tema: Tema; temaToggle: () => void }) {
  const [kaydirma, setKaydirma] = useState(false);

  useEffect(() => {
    const handler = () => setKaydirma(window.scrollY > 32);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navTiklandi = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, hedef: string) => {
      e.preventDefault();
      const el = document.querySelector(hedef);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    []
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        kaydirma
          ? "bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl backdrop-saturate-150 border-b border-zinc-200/60 dark:border-white/8 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        {/* Marka */}
        <a
          href="/"
          className="tracking-[0.18em] text-[13px] font-bold text-zinc-950 dark:text-zinc-50 select-none"
        >
          {icerik.marka.ad}
        </a>

        {/* Sağ Aksiyonlar */}
        <div className="flex items-center gap-2">
          <button
            onClick={temaToggle}
            aria-label="Tema değiştir"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-white/8 transition-all duration-200"
          >
            {tema === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-[17px] w-[17px]">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-[17px] w-[17px]">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <a
            href="/login"
            className="hidden h-9 items-center rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white hover:bg-zinc-800 active:scale-[0.97] transition-all duration-200 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 md:flex"
          >
            {icerik.nav.girisYap}
          </a>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-28">
      {/* Zemin */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#F8F9FA] dark:bg-[#09090B] transition-colors duration-300" />

      {/* Yumuşak ışık huzmesi */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(251,191,36,0.11),transparent)] dark:bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(251,191,36,0.07),transparent)]"
      />

      {/* İçerik */}
      <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
        {/* Üst etiket */}
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
          Teknik Destek Platformu
        </p>

        {/* Ana başlık */}
        <h1 className="mb-10 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-950 dark:text-zinc-50 lg:text-5xl">
          HİLAL İZOLASYON
        </h1>

        {/* CTA — sadece giriş */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/login"
            className="inline-flex h-12 items-center rounded-2xl bg-zinc-950 px-7 text-sm font-semibold text-white shadow-lg hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
          >
            Platforma Giriş Yap
          </a>
        </div>
      </div>

      {/* Aşağı ok */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
        <div className="h-10 w-px bg-gradient-to-b from-zinc-300/0 via-zinc-300 to-zinc-300/0 dark:via-zinc-600 animate-pulse" />
      </div>
    </section>
  );
}

// ─── Fark Bölümü (KPI Yerine) ──────────────────────────────────────────────
function FarkBolumu() {
  return (
    <section className="border-y border-zinc-200/80 dark:border-white/8 bg-[#F8F9FA] dark:bg-[#09090B]">
      <div className="mx-auto max-w-7xl">
        <div className="grid divide-y divide-zinc-200/80 dark:divide-white/8 md:grid-cols-3 md:divide-x md:divide-y-0">
          {icerik.fark.map((madde) => (
            <div key={madde.no} className="flex flex-col gap-3 px-8 py-10">
              <span className="text-[11px] font-bold tracking-[0.18em] text-amber-500 dark:text-amber-400 uppercase">
                {madde.no}
              </span>
              <h3 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                {madde.baslik}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {madde.aciklama}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Modüller Bölümü ────────────────────────────────────────────────────────
function ModullerBolumu() {
  return (
    <section
      id="ozellikler"
      className="py-28 px-6 bg-[#F8F9FA] dark:bg-[#09090B] scroll-mt-20"
    >
      <div className="mx-auto max-w-7xl">
        {/* Başlık */}
        <div className="mb-16 max-w-lg">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            Platform Modülleri
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight lg:text-5xl">
            İhtiyacınız olan her şey, tek çatı altında.
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {icerik.moduller.map((mod, i) => (
            <div
              key={mod.baslik}
              className={`group relative overflow-hidden rounded-3xl border p-8 transition-all duration-300 ${
                i === 0
                  ? "lg:col-span-2 bg-zinc-950 dark:bg-zinc-50 border-zinc-900 dark:border-zinc-200"
                  : "bg-white/90 dark:bg-[#121214]/80 backdrop-blur-xl border-zinc-200/80 dark:border-white/8 hover:border-zinc-300 dark:hover:border-white/15"
              } shadow-[0_4px_24px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgb(0,0,0,0.35)]`}
            >
              {/* Vurgu kartı için dekorasyon */}
              {i === 0 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_90%_10%,rgba(251,191,36,0.15),transparent)]"
                />
              )}

              <div className="relative z-10 flex h-full flex-col">
                {/* Etiket */}
                <div
                  className={`mb-6 inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                    i === 0
                      ? "bg-white/10 text-amber-400"
                      : "bg-zinc-100 dark:bg-white/6 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  <span
                    className={`${
                      i === 0
                        ? "text-amber-400"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {mod.ikon}
                  </span>
                  {mod.etiket}
                </div>

                <h3
                  className={`mb-3 text-xl font-bold tracking-tight leading-snug ${
                    i === 0
                      ? "text-white dark:text-zinc-950"
                      : "text-zinc-950 dark:text-zinc-50"
                  }`}
                >
                  {mod.baslik}
                </h3>

                <p
                  className={`text-sm leading-relaxed ${
                    i === 0
                      ? "text-zinc-400 dark:text-zinc-600"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {mod.aciklama}
                </p>

                {/* Hover oku */}
                <div
                  className={`mt-8 flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                    i === 0
                      ? "text-amber-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <span>Keşfet</span>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Tanıtım (CTA Yerine) ──────────────────────────────────────────────────
function TanitimBolumu() {
  return (
    <section className="py-28 px-6 bg-[#F8F9FA] dark:bg-[#09090B]">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-white/8 bg-white/90 dark:bg-[#121214]/80 backdrop-blur-xl p-12 md:p-16 shadow-[0_8px_40px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.4)]">
          {/* Dekor */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_100%_100%,rgba(251,191,36,0.07),transparent)] dark:bg-[radial-gradient(ellipse_50%_60%_at_100%_100%,rgba(251,191,36,0.05),transparent)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-px w-1/2 bg-gradient-to-l from-amber-400/30 to-transparent"
          />

          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-start md:gap-16">
            {/* Sol: Başlık */}
            <div className="shrink-0 md:w-56">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
                Hakkımızda
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 leading-snug">
                {icerik.tanitim.baslik}
              </h2>
              <div className="mt-6 h-px w-12 bg-amber-500/60" />
            </div>

            {/* Sağ: Metin */}
            <p className="flex-1 text-[1.05rem] leading-[1.85] text-zinc-600 dark:text-zinc-300">
              {icerik.tanitim.metin}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-zinc-200/80 dark:border-white/8 bg-[#F8F9FA] dark:bg-[#09090B] px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 md:flex-row md:justify-between">
        <span className="tracking-[0.18em] text-[13px] font-bold text-zinc-950 dark:text-zinc-50">
          {icerik.marka.ad}
        </span>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {icerik.footer.telif}
        </p>
        <div className="flex items-center gap-6">
          {(["gizlilik", "kullanim", "kvkk"] as const).map((key) => (
            <a
              key={key}
              href="#"
              className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              {icerik.footer[key]}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const [tema, setTema] = useState<Tema>("dark");
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    const baslangic = baslangicTemasiniHesapla();
    setTema(baslangic);
    setYuklendi(true);
  }, []);

  useEffect(() => {
    if (!yuklendi) return;
    const html = document.documentElement;
    if (tema === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("hilal-tema", tema);
  }, [tema, yuklendi]);

  const temaToggle = useCallback(() => {
    setTema((onceki) => (onceki === "dark" ? "light" : "dark"));
  }, []);

  if (!yuklendi) {
    return <div className="min-h-screen bg-[#09090B]" aria-hidden />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090B] transition-colors duration-300">
      <NavBar tema={tema} temaToggle={temaToggle} />
      <main>
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
