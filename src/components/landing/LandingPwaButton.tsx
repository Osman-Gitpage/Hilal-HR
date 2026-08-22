"use client";

import * as React from "react";
import { Download, Smartphone, Laptop, Apple, Chrome, X, Check, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface LandingPwaButtonProps {
  variant?: "hero" | "header" | "card";
  className?: string;
}

type TabType = "android" | "ios" | "windows" | "mac";

export function LandingPwaButton({ variant = "hero", className = "" }: LandingPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabType>("windows");
  const [canDirectInstall, setCanDirectInstall] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Cihaz tespiti ile varsayılan sekmeyi ayarla
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActiveTab("ios");
    } else if (/android/.test(ua)) {
      setActiveTab("android");
    } else if (/macintosh|mac os x/.test(ua)) {
      setActiveTab("mac");
    } else {
      setActiveTab("windows");
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanDirectInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  }, []);

  const handleDirectInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setShowModal(false);
        }
      } catch (err) {
        console.warn("Direct install error:", err);
      }
      setDeferredPrompt(null);
      setCanDirectInstall(false);
    } else {
      setShowModal(true);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (deferredPrompt) {
      handleDirectInstall();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {variant === "header" && (
        <button
          type="button"
          onClick={handleButtonClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-all active:scale-95 cursor-pointer shadow-xs ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">Uygulamayı İndir</span>
          <span className="sm:hidden">İndir</span>
        </button>
      )}

      {variant === "hero" && (
        <button
          type="button"
          onClick={handleButtonClick}
          className={`inline-flex items-center justify-center gap-2.5 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-slate-50 text-slate-800 font-extrabold px-6 py-4 rounded-full shadow-lg shadow-slate-200/60 transition-all duration-200 text-base active:scale-95 cursor-pointer hover:shadow-xl ${className}`}
        >
          <Download className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Uygulamayı İndir / Kur</span>
        </button>
      )}

      {/* ── İndirme & Kurulum Merkezi Modalı ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-200 text-slate-800"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 text-left max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Üst Başlık */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Hilal Office Kurulumu</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Mobil & Masaüstü Uygulama Merkezi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doğrudan İndirme Butonu (Destekleyen tarayıcılarda) */}
            {canDirectInstall && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-emerald-900">Tarayıcınız Doğrudan Kurulumu Destekliyor</p>
                  <p className="text-[11px] text-emerald-700">Tek tıkla cihazınıza anında kurun.</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleDirectInstall}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-xl gap-1.5 shrink-0 shadow-md shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  Şimdi Kur
                </Button>
              </div>
            )}

            {/* Platform Seçim Sekmeleri */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab("windows")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "windows"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-blue-600" />
                <span>Windows</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("android")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "android"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ios")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "ios"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Apple className="w-3.5 h-3.5 text-slate-900" />
                <span>iPhone</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("mac")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "mac"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Apple className="w-3.5 h-3.5 text-slate-900" />
                <span>Mac OS</span>
              </button>
            </div>

            {/* Platform Detay İçeriği */}
            <div className="space-y-3">
              {activeTab === "windows" && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span>Windows / PC Kurulum Adımları:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li>
                      <strong>Google Chrome</strong> veya <strong>Microsoft Edge</strong> ile siteyi açın.
                    </li>
                    <li>
                      Üst adres çubuğunun sağ tarafındaki <strong>&quot;Uygulamayı Yükle&quot;</strong> simgesine (veya sağ üstteki 3 nokta menüsünden <em>&quot;Hilal Office Uygulamasını Yükle&quot;</em>) tıklayın.
                    </li>
                    <li>
                      <strong>&quot;Yükle&quot;</strong> butonuna bastığınızda uygulama masaüstünüze ve Başlat menünüze tek tıkla eklenecektir.
                    </li>
                  </ol>
                </div>
              )}

              {activeTab === "android" && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Android Telefon / Tablet Kurulum Adımları:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li>
                      <strong>Chrome</strong> tarayıcınızda sağ üstteki <strong>3 nokta (Menü)</strong> butonuna dokunun.
                    </li>
                    <li>
                      Menüden <strong>&quot;Uygulamayı Yükle&quot;</strong> veya <strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğine basın.
                    </li>
                    <li>
                      Onayladığınızda telefonunuzun ana ekranına bağımsız uygulama ikonu olarak eklenecektir.
                    </li>
                  </ol>
                </div>
              )}

              {activeTab === "ios" && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Apple className="w-4 h-4 text-slate-900" />
                    <span>iPhone & iPad (Safari) Kurulum Adımları:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li>
                      Bu sayfayı <strong>Safari</strong> tarayıcısı ile açın.
                    </li>
                    <li>
                      Ekranın alt kısmındaki <strong>Paylaş (Kare ve yukarı ok simgesi)</strong> butonuna dokunun.
                    </li>
                    <li>
                      Aşağı kaydırıp <strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğini seçin.
                    </li>
                    <li>
                      Sağ üst köşedeki <strong>&quot;Ekle&quot;</strong> butonuna basın. Uygulama tam ekran olarak telefonunuza kurulacaktır.
                    </li>
                  </ol>
                </div>
              )}

              {activeTab === "mac" && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Apple className="w-4 h-4 text-slate-900" />
                    <span>Mac OS (Chrome / Safari) Kurulum Adımları:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li>
                      <strong>Safari</strong> veya <strong>Chrome</strong> ile sayfayı açın.
                    </li>
                    <li>
                      Safari için: Üst menüden <em>Dosya ➜ &quot;Dock&apos;a Ekle&quot;</em> seçeneğine tıklayın.
                    </li>
                    <li>
                      Chrome için: Adres çubuğundaki <strong>&quot;Yükle&quot;</strong> butonuna basın.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* Alt Kapat / Tamam Butonu */}
            <div className="pt-1">
              <Button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-11 font-bold text-sm"
              >
                Anladım, Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
