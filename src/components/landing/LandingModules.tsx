const modules = [
  {
    tag: "Personel",
    title: "Personel Yönetimi",
    desc: "Çalışan profilleri, sözleşmeler, belgeler ve kariyer geçmişini merkezi bir yerden yönetin. İşe alım süreçlerini hızlandırın.",
    points: [
      "Kapsamlı personel profilleri",
      "Belge yönetimi & e-imza",
      "İşe alım & çıkış süreç yönetimi",
      "Organizasyon şeması",
    ],
    dotColor: "bg-blue-400",
    tagColor: "text-blue-400",
    tagBg: "bg-blue-400/10",
    tagBorder: "border-blue-400/20",
    checkColor: "#60a5fa",
  },
  {
    tag: "Bordro",
    title: "Bordro & Ücret Yönetimi",
    desc: "SGK bildirgeleri, stopaj ve net ücret hesaplamalarını otomatikleştirin. Yasal mevzuat değişikliklerine otomatik uyum.",
    points: [
      "Otomatik SGK & vergi hesaplama",
      "Toplu bordro işleme",
      "Bordro slip üretimi (PDF)",
      "Yasal mevzuat takibi",
    ],
    dotColor: "bg-emerald-400",
    tagColor: "text-emerald-400",
    tagBg: "bg-emerald-400/10",
    tagBorder: "border-emerald-400/20",
    checkColor: "#34d399",
  },
  {
    tag: "Puantaj",
    title: "Puantaj & Mesai Takibi",
    desc: "Vardiya planlaması, mesai takibi ve izin yönetimini entegre şekilde yürütün. Puantaj verileri bordroya otomatik aktarılır.",
    points: [
      "Günlük puantaj girişi",
      "Fazla mesai otomatik hesaplama",
      "İzin & rapor yönetimi",
      "Vardiya planlama",
    ],
    dotColor: "bg-amber-400",
    tagColor: "text-amber-400",
    tagBg: "bg-amber-400/10",
    tagBorder: "border-amber-400/20",
    checkColor: "#fbbf24",
  },
  {
    tag: "Cari",
    title: "Cari Hesap Yönetimi",
    desc: "Firma bazlı cari hesapları, ödemeler ve tahsilatları takip edin. Mutabakat mektuplarını otomatik oluşturun.",
    points: [
      "Çoklu para birimi desteği",
      "Otomatik mutabakat",
      "Ödeme & tahsilat takibi",
      "Cari ekstre raporları",
    ],
    dotColor: "bg-violet-400",
    tagColor: "text-violet-400",
    tagBg: "bg-violet-400/10",
    tagBorder: "border-violet-400/20",
    checkColor: "#a78bfa",
  },
];

export default function LandingModules() {
  return (
    <section id="moduller" className="py-28 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <div className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-4">
            Modüller
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-5">
            Dört modül,
            <br />
            <span className="text-zinc-400">tam kapsam</span>
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Birbirini tamamlayan modüller sayesinde veri akışı kesintisiz;
            manuel giriş minimuma iner.
          </p>
        </div>

        {/* Modules grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {modules.map((m, i) => (
            <div
              key={i}
              className="group border border-zinc-800 rounded-2xl p-7 hover:border-zinc-700 transition-all duration-300 flex flex-col gap-5"
            >
              {/* Tag */}
              <div className={`self-start text-xs font-semibold px-3 py-1 rounded-full border ${m.tagColor} ${m.tagBg} ${m.tagBorder}`}>
                {m.tag}
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">{m.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{m.desc}</p>
              </div>

              {/* Points */}
              <ul className="flex flex-col gap-2 pt-1">
                {m.points.map((p, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-zinc-400">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                      <path d="M2.5 7l3 3 6-6" stroke={m.checkColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
