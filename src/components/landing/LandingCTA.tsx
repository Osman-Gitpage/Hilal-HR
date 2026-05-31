import Link from "next/link";

export default function LandingCTA() {
  return (
    <section className="py-28 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="border border-zinc-800 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
          {/* Subtle background texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, #52525b 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
            aria-hidden
          />

          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="text-xs font-semibold text-zinc-500 tracking-widest uppercase">
              Hazır mısınız?
            </div>

            <h2 className="text-4xl lg:text-6xl font-bold text-white tracking-tight leading-[1.08]">
              İK yönetiminizi
              <br />
              <span className="text-zinc-400">bugün dönüştürün</span>
            </h2>

            <p className="text-zinc-400 max-w-md leading-relaxed">
              Kurulum gerektirmez. Dakikalar içinde başlayın,
              tüm ekibinizi kolayca davet edin.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/giris"
                className="inline-flex items-center gap-2 bg-white text-zinc-950 font-semibold px-8 py-3.5 rounded-xl hover:bg-zinc-100 transition-all duration-200 active:scale-95"
              >
                Ücretsiz Başlayın
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3.75 9h10.5M10.5 5.25 14.25 9l-3.75 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            {/* Mini trust indicators */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {["Kredi kartı gerekmez", "Sınırsız deneme", "İstediğiniz zaman iptal"].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l2.5 2.5 5.5-5" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
