"use client";

import { 
  BarChart3, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  FileCheck2, 
  CheckCircle2,
  Clock,
  Briefcase,
  FileArchive,
  Layers
} from "lucide-react";

export default function LandingRolesGrid() {
  return (
    <section id="herkes-icin" className="py-24 sm:py-32 bg-[#F8F9FB] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.10] mb-4">
            Saha ve Ofis Ekipleri İçin Tasarlandı
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal">
            Tersanelerden şantiyelere, holdinglerden mali müşavirlere kadar tüm paydaşlar için özel görünüm ve yetkilendirmeler.
          </p>
        </div>

        {/* Top 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Card 1: İK ve Saha Yöneticileri */}
          <div className="rounded-[32px] bg-white border border-slate-200/80 p-8 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 group">
            <div>
              {/* Visual Puantaj Chart Pill */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-8 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-extrabold text-slate-700">
                  <span>31 Gün Puantaj Matrisi</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    PM / RT / Yİ
                  </span>
                </div>
                
                {/* Visual Bar Graph (Emerald) */}
                <div className="flex items-end gap-2 h-16 pt-2">
                  <div className="flex-1 bg-emerald-200 rounded-lg h-[40%]" />
                  <div className="flex-1 bg-emerald-400 rounded-lg h-[65%]" />
                  <div className="flex-1 bg-emerald-600 rounded-lg h-[90%]" />
                  <div className="flex-1 bg-teal-500 rounded-lg h-[75%]" />
                  <div className="flex-1 bg-emerald-300 rounded-lg h-[50%]" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                İK & Saha Yöneticileri İçin
              </h3>
              <p className="text-sm text-slate-600 font-normal leading-relaxed">
                Tüm çalışanlarınız, vardiyalar ve 31 günlük puantaj matrisi (PM 16s, RT 8s, Yİ) için tek merkezi altyapı.
              </p>
            </div>
          </div>

          {/* Card 2: Tersane & Şantiye Liderleri */}
          <div className="rounded-[32px] bg-white border border-slate-200/80 p-8 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 group">
            <div>
              {/* Visual 3D Icon Badge */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 mb-8 flex items-center justify-center relative overflow-hidden min-h-[120px]">
                <div className="inline-flex items-center gap-3 bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-lg shadow-slate-200/60 text-xs font-black text-slate-900 group-hover:scale-105 transition-transform">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md">
                    <FileArchive className="w-4 h-4" />
                  </div>
                  <span>ZIP Özlük Paketi Çıktısı</span>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                Tersane & Şantiye Liderleri İçin
              </h3>
              <p className="text-sm text-slate-600 font-normal leading-relaxed">
                Ana yükleniciye sunulacak İSG, KKD beyanı ve sağlık raporlarını saniyeler içinde doldurup ZIP olarak indirin.
              </p>
            </div>
          </div>

          {/* Card 3: Mali İşler & Muhasebe */}
          <div className="rounded-[32px] bg-white border border-slate-200/80 p-8 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 group">
            <div>
              {/* Visual Badge */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 mb-8 flex items-center justify-center relative overflow-hidden min-h-[120px]">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xl shadow-slate-900/30 border-2 border-white group-hover:scale-110 transition-transform">
                  <Layers className="w-8 h-8" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                Mali İşler & Muhasebe İçin
              </h3>
              <p className="text-sm text-slate-600 font-normal leading-relaxed">
                Geriye dönük ezilmeyen versiyonlu bordro (v1, v2), avans/icra takibi ve parçalı ödemeli cari hesaplar.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Wide Bento Card Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Wide Card: Personel Özlük & Puantaj */}
          <div className="lg:col-span-8 rounded-[32px] bg-white border border-slate-200/80 p-8 shadow-xl shadow-slate-200/40 flex flex-col justify-between">
            <div className="flex flex-col gap-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="font-extrabold text-slate-900 text-sm">Saha & Ofis Personel İstatistikleri</div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">Günlük</span>
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full">Aylık</span>
                </div>
              </div>

              {/* Bar Chart Visual (Emerald) */}
              <div className="flex items-end gap-3 h-32 pt-4">
                {[35, 50, 75, 60, 90, 80, 100].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div
                      className={`w-full rounded-t-xl transition-all ${
                        i === 6 ? "bg-gradient-to-t from-emerald-600 to-teal-500 shadow-md" : "bg-slate-200 group-hover:bg-emerald-200"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <h3 className="text-xl font-black text-slate-900 mb-1">Eksiksiz Puantaj & Bordro Uyumu</h3>
                <p className="text-xs text-slate-600 font-normal">
                  Çalışanların tüm çalışma saatleri ve özel durum kodları eksiksiz kayıt altına alınır.
                </p>
              </div>
            </div>
          </div>

          {/* Right Circular Avatar Ring Card */}
          <div className="lg:col-span-4 rounded-[32px] bg-white border border-slate-200/80 p-8 shadow-xl shadow-slate-200/40 flex flex-col items-center justify-center text-center">
            
            {/* Avatar Wheel Visual */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              <div className="absolute inset-0 border-2 border-dashed border-emerald-300 rounded-full animate-spin-slow" />
              
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-600/30">
                <Users className="w-6 h-6" />
              </div>

              {/* Surrounding Avatar Badges */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-md">
                SY
              </div>
              <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-8 h-8 rounded-full bg-teal-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-md">
                FK
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-md">
                MD
              </div>
              <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-md">
                AY
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">Çoklu Şirket İzolasyonu</h3>
            <p className="text-xs text-slate-600 font-normal">
              PostgreSQL RLS ile şirketler arası tam veri güvenliği.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}
