"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Hilal Office ile çoklu şirket yapısını nasıl yönetirim?",
    a: "Sistemimiz doğuştan çoklu şirket (multi-tenant) mimarisine sahiptir. Tek ana kullanıcı oturumundan dilediğiniz kadar grup şirketi veya şube ekleyebilir, her şirket için ayrı veya konsolide bordro ve cari raporlar oluşturabilirsiniz.",
  },
  {
    q: "Tersane ve şantiye özlük ZIP paketi oluşturucu nasıl çalışır?",
    a: "Seçtiğiniz personeller için tanımlanmış Word (`docxtemplater`) görevlendirme belgelerini ve PDF formlarını (`pdf-lib`) otomatik doldurur. Şeffaf kaşe/imza görsellerini basar, sistemdeki aktif adli sicil ve sağlık raporu PDF'leri ile sırayla birleştirip tek tıkla ZIP paketi olarak indirmenizi sağlar.",
  },
  {
    q: "Mevcut Excel verilerimizi ve personel özlük dosyalarını içeri aktarabilir miyiz?",
    a: "Kesinlikle. Toplu Excel aktarım sihirbazımız sayesinde binlerce personelin özlük verilerini, geçmiş bordrolarını ve cari hesap kartlarını dakikalar içinde sisteme sorunsuz aktarabilirsiniz.",
  },
  {
    q: "Verilerimiz nasıl korunuyor ve KVKK uyumu sağlama süreci nasıl işliyor?",
    a: "Verileriniz ISO 27001 sertifikalı bulut sunucularımızda bankacılık standartlarında (AES-256) şifrelenir. Rol bazlı yetkilendirme ile her kullanıcının sadece görmeye yetkili olduğu veriye erişmesini sağlarsınız.",
  },
  {
    q: "Ücretsiz deneme süresi bittiğinde kurulum veya gizli ücret öder miyim?",
    a: "Hayır. Ücretsiz deneme süresince tüm özellikleri kısıtlamasız test edebilirsiniz. Sonrasında ihtiyacınıza uygun paketi seçebilir, istediğiniz zaman taahhütsüz iptal edebilirsiniz.",
  },
];

export default function LandingFaqCore() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 sm:py-32 bg-white border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4">
            Sıkça Sorulan Sorular
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal">
            Aklınıza takılan tüm soruların yanıtları.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? "border-emerald-300 bg-emerald-50/40 shadow-md" 
                    : "border-slate-200/80 bg-[#F8F9FB] hover:bg-slate-100"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-extrabold text-slate-900 hover:text-emerald-700 transition-colors"
                >
                  <span className="text-base sm:text-lg">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform ${isOpen ? "rotate-180 bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
