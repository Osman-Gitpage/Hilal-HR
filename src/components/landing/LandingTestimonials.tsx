const testimonials = [
  {
    quote:
      "Hilal İK sayesinde 8 şirketimizin bordrolarını aynı anda işliyoruz. Aylık 3 günlük iş yükümüz 4 saate indi.",
    name: "Kemal Arslan",
    role: "Mali Müşavir, Arslan Danışmanlık",
    initials: "KA",
  },
  {
    quote:
      "Puantaj ile bordro modüllerinin entegrasyonu mükemmel. Artık çift veri girişi yok, hata oranımız sıfıra indi.",
    name: "Selin Çelik",
    role: "İK Müdürü, Çelik Holding",
    initials: "SÇ",
  },
  {
    quote:
      "Arayüz son derece kullanıcı dostu. Ekibimiz adaptasyon sürecinde hiç sorun yaşamadı, 1 günde alıştılar.",
    name: "Murat Öztürk",
    role: "Genel Müdür, Öztürk İnşaat",
    initials: "MÖ",
  },
];

export default function LandingTestimonials() {
  return (
    <section id="referanslar" className="py-28 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-4">
              Referanslar
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              Müşterilerimiz
              <br />
              <span className="text-zinc-400">ne diyor?</span>
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} width="18" height="18" viewBox="0 0 18 18" fill="#fbbf24">
                <path d="M9 1.5l2.06 4.17 4.6.67-3.33 3.24.79 4.59L9 11.77l-4.12 2.4.79-4.59L2.34 6.34l4.6-.67L9 1.5z"/>
              </svg>
            ))}
            <span className="text-sm text-zinc-500 ml-2">4.9 / 5.0</span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="border border-zinc-800 rounded-2xl p-7 flex flex-col gap-6 hover:border-zinc-700 transition-colors duration-300"
            >
              {/* Quote icon */}
              <svg width="28" height="20" viewBox="0 0 32 24" fill="none" className="text-zinc-700">
                <path d="M0 24V14.4C0 6.4 4.267 1.6 12.8 0L14.4 2.4C10.933 3.467 8.8 5.333 8 8H13.6V24H0ZM17.6 24V14.4C17.6 6.4 21.867 1.6 30.4 0L32 2.4C28.533 3.467 26.4 5.333 25.6 8H31.2V24H17.6Z" fill="currentColor"/>
              </svg>

              <p className="text-zinc-300 text-sm leading-relaxed flex-1">{t.quote}</p>

              <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-zinc-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
