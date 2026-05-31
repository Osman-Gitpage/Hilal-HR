const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Çok Firmalı Yönetim",
    desc: "Birden fazla şirket ve departmanı tek oturumdan yönetin. Konsolidasyon ve karşılaştırma raporları otomatik üretilir.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 8h12M6 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Otomatik Bordro",
    desc: "SGK, vergi ve kesinti hesaplamalarını otomatik yapın. Aylık bordrolar dakikalar içinde hazır, hatasız.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 16l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Puantaj Takibi",
    desc: "Günlük, haftalık ve aylık puantaj girişleri. Fazla mesai, izin ve devamsızlık otomatik hesaplanır.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M18 9l-5 5-2-2-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Detaylı Raporlar",
    desc: "Personel, maliyet ve performans raporlarını Excel veya PDF olarak dışa aktarın. Gerçek zamanlı veri.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Cari Hesap Yönetimi",
    desc: "Tedarikçi ve müşteri cari hesaplarını takip edin. Borç, alacak ve mutabakat işlemlerini kolayca yönetin.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Güvenli & KVKK Uyumlu",
    desc: "Verileriniz şifrelenmiş ortamda saklanır. Rol bazlı erişim kontrolü ve tam KVKK uyumu ile çalışırsınız.",
  },
];

export default function LandingFeatures() {
  return (
    <section id="ozellikler" className="py-28 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <div className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-4">
            Özellikler
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-5">
            Her şey düşünülmüş,
            <br />
            <span className="text-zinc-400">sizin için hazır</span>
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Modern bir İK yönetim sisteminden beklediğiniz tüm özellikler,
            sezgisel bir arayüzle bir arada.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-zinc-950 p-8 flex flex-col gap-4 group hover:bg-zinc-900 transition-colors duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors duration-300 flex items-center justify-center text-zinc-300">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold text-base">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
