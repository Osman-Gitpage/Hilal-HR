"use client";

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Hilal Office sayesinde 12 farklı grup şirketimizin tüm bordrolama ve SGK puantaj süreçlerini tek bir platformda topladık. Her ay günlerce süren dosyalar artık anında tamamlanıyor.",
    author: "Selim Arslan",
    role: "İnsan Kaynakları Direktörü",
    company: "Arslan Holding A.Ş.",
    avatar: "SA",
  },
  {
    quote: "Tersane ve ana yüklenici onayları için özlük dosyalarını hazırlamak büyük dertti. Hilal Office'ın otomatik PDF birleştirme ve ZIP paketleyici özelliği işimizi inanılmaz kolaylaştırdı.",
    author: "Ayşe Yılmaz",
    role: "Mali İşler & Muhasebe Müdürü",
    company: "Novatech Teknoloji",
    avatar: "AY",
  },
  {
    quote: "Süreli evrak takibi ve puantaj matrisi saha ekibimizin vazgeçilmezi oldu. Kesinlikle Türkiye'deki en modern ve pratik İK platformu.",
    author: "Murat Demir",
    role: "Operasyon Direktörü",
    company: "Demir Lojistik",
    avatar: "MD",
  },
];

export default function LandingTestimonialsCore() {
  return (
    <section id="referanslar" className="py-24 sm:py-32 bg-[#F8F9FB] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4">
            Müşteri Başarı Hikayeleri
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal">
            Lider İK yöneticilerinin Hilal Office hakkındaki görüşleri.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-[32px] bg-white border border-slate-200/80 p-8 flex flex-col justify-between shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:border-emerald-300 transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-6">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed italic mb-8 font-normal">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 font-black text-white flex items-center justify-center text-sm shadow-md shrink-0">
                  {t.avatar}
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-900 text-sm">
                    {t.author}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {t.role} — <strong className="text-slate-700">{t.company}</strong>
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
