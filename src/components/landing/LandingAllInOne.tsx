"use client";

import { 
  Building2, 
  Users, 
  Receipt, 
  FolderKanban, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Lock,
  Sparkles,
  FileArchive,
  Layers
} from "lucide-react";

const platformModules = [
  {
    icon: FileArchive,
    badge: "Tersane & Şantiye",
    color: "bg-emerald-600",
    title: "Otomatik Özlük Paketi Sihirbazı",
    desc: "Word (`docxtemplater`) ve PDF (`pdf-lib`) belgelerine personel verilerini doldurur, şeffaf kaşe/imza basar, adli sicil & sağlık raporuyla birleştirip ZIP paketi sunar.",
    points: ["Şablon Görevlendirme & KKD Formları", "Sıralı PDF Birleştirme (pdf-lib merge)", "Tek Tıkla Toplu ZIP İndirme"],
  },
  {
    icon: Layers,
    badge: "Versiyonlu Bordro",
    color: "bg-indigo-600",
    title: "Geriye Dönük Versiyonlu Bordro",
    desc: "Geçmiş bordrolar ezilmez. 'Revizyon Başlat' ile v1 salt okunur pasiflenir, v2 taslak olarak kopyalanır. Değişiklikler onaylandıktan sonra kilitlenir.",
    points: ["Taslak → Kontrol → Onaylandı → Kilitlendi", "Avans, İcra & İçeri Avans Devir Takibi", "Gerekçeli Yetkili Kilit Açma"],
  },
  {
    icon: FolderKanban,
    badge: "Evrak Deposu",
    color: "bg-teal-600",
    title: "Süreli Evrak Radar Kulesi",
    desc: "Geçerliliği dolacak adli sicil, sağlık raporu, ehliyet ve sözleşmeler için 30 gün önceden otomatik sarı alarm, dolduğunda kırmızı alarm verilir.",
    points: ["30 Gün Kala Otomatik Uyarı Alarmı", "Son 3 Evrak Versiyonunu Saklama", "Backblaze B2 S3 Uyumlu Şifreleme"],
  },
  {
    icon: Building2,
    badge: "Çoklu Şirket",
    color: "bg-slate-900",
    title: "Çoklu Şirket (Multi-Tenant) Yönetimi",
    desc: "Holding, grup şirketleri ve şubelerinizi tek oturumda konsolide edin. PostgreSQL RLS (Row Level Security) ile tam şirket verisi izolasyonu.",
    points: ["Tek Ana Hesap İle Sınırsız Firma", "Şirketler Arası Kolay Geçiş", "PostgreSQL Row Level Security"],
  },
];

export default function LandingAllInOne() {
  return (
    <section id="cozumler" className="py-24 sm:py-32 bg-white relative border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-xs font-black text-emerald-800 mb-4 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Hilal Office Özel Çözümleri</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4">
            Endüstriyel İK Ekosistemi
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal">
            Farklı yazılımlar ve karmaşık tablolar arasında kaybolmayın. İhtiyacınız olan tüm modüller Hilal Office platformunda.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {platformModules.map((m, idx) => {
            const IconComp = m.icon;
            return (
              <div
                key={idx}
                className="group rounded-[32px] border border-slate-200/80 bg-[#F8F9FB] p-8 sm:p-10 flex flex-col justify-between hover:bg-white hover:shadow-2xl hover:shadow-slate-200/60 hover:border-emerald-300 transition-all duration-300"
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between mb-8">
                    <div className={`w-14 h-14 rounded-2xl ${m.color} text-white flex items-center justify-center font-bold shadow-lg group-hover:scale-110 transition-transform`}>
                      <IconComp className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
                      {m.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                    {m.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-normal mb-8">
                    {m.desc}
                  </p>

                  {/* Bullet Points */}
                  <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-200/60">
                    {m.points.map((p, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 flex items-center justify-between text-xs font-black text-emerald-700">
                  <span>Modülü İnceleyin</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
