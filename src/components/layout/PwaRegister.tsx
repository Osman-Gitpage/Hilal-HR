"use client";

import * as React from "react";
import { Download, X, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [showIOSGuide, setShowIOSGuide] = React.useState(false);

  React.useEffect(() => {
    // 1. Service Worker Kaydı
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Güncelleme kontrolü
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // Yeni sürüm hazır
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("PWA Service Worker kaydı atlandı:", err);
        });
    }

    // 2. Uygulama Zaten Yüklü mü Kontrolü (Standalone mode)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // 3. iOS Tespiti
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Android / Chrome / Edge Install Prompt Yakalayıcı
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Daha önce reddedilmediyse 2 saniye sonra göster
      const dismissed = localStorage.getItem("hilal_pwa_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 2500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    try {
      localStorage.setItem("hilal_pwa_dismissed", "true");
    } catch {
      // ignore
    }
  };

  if (isStandalone || (!showPrompt && !showIOSGuide)) {
    return null;
  }

  return (
    <aside
      aria-label="Uygulama Yükleme Bildirimi"
      className="fixed top-4 right-4 sm:top-auto sm:bottom-20 sm:right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-[360px] animate-in fade-in-0 slide-in-from-top-4 sm:slide-in-from-bottom-4 duration-300"
    >
      <div className="rounded-2xl border border-border/80 bg-background/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 space-y-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-foreground truncate">Hilal Office Uygulaması</h4>
              <p className="text-[11px] text-muted-foreground truncate">
                {isIOS ? "Ana ekrana ekleyip tam ekran kullanın" : "Hızlı erişim için cihazınıza yükleyin"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-muted-foreground/60 hover:text-foreground p-1 rounded-lg transition-colors shrink-0"
            title="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showIOSGuide ? (
          <div className="rounded-xl border border-border/50 bg-muted/40 p-2.5 text-xs text-muted-foreground space-y-1.5 animate-in fade-in-0 duration-150">
            <p className="font-semibold text-foreground text-[11px]">iPhone / iPad Kurulumu:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px]">
              <li>Safari alt menüsündeki <strong>Paylaş</strong> butonuna basın.</li>
              <li>Aşağı kaydırıp <strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğine dokunun.</li>
            </ol>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowIOSGuide(false)}
              className="w-full h-7 text-xs mt-1"
            >
              Anladım
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="flex-1 h-8 text-xs font-medium gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              {isIOS ? "Nasıl Yüklenir?" : "Uygulamayı Yükle"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 text-xs text-muted-foreground"
            >
              Daha Sonra
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
