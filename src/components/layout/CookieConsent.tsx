"use client";

import * as React from "react";
import { Cookie, ShieldCheck, ChevronDown, ChevronUp, Check, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const STORAGE_KEY = "hilal_cookie_consent_v1";

interface CookiePreferences {
  essential: boolean; // Zorunlu (Supabase Auth, Oturum, Güvenlik)
  preferences: boolean; // Tercihler (Tema, Sidebar durumu vb.)
  analytics: boolean; // Analitik & Performans
  date: string;
}

export function CookieConsent() {
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  const [prefs, setPrefs] = React.useState<CookiePreferences>({
    essential: true,
    preferences: true,
    analytics: false,
    date: "",
  });

  React.useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // İlk kez gelen kullanıcıya kısa bir gecikmeyle göster
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage erişim engeli durumunda sessiz kal
    }
  }, []);

  // Globalden tercihler modalını tekrar açmak için event dinleyici
  React.useEffect(() => {
    const handleReopen = () => setVisible(true);
    window.addEventListener("open-cookie-settings", handleReopen);
    return () => window.removeEventListener("open-cookie-settings", handleReopen);
  }, []);

  if (!mounted || !visible) return null;

  const saveConsent = (preferences: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      preferences: true,
      analytics: true,
      date: new Date().toISOString(),
    });
  };

  const handleAcceptEssential = () => {
    saveConsent({
      essential: true,
      preferences: false,
      analytics: false,
      date: new Date().toISOString(),
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      ...prefs,
      essential: true,
      date: new Date().toISOString(),
    });
  };

  return (
    <aside
      aria-label="Çerez İzni Bildirimi"
      className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-[420px] animate-in fade-in-0 slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl border border-border/80 bg-background/95 p-5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 space-y-4">
        {/* Başlık ve Kapat/Simge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Çerez ve Gizlilik Tercihleri
              </h2>
              <p className="text-[11px] text-muted-foreground">KVKK & GDPR Uyumlu Bilgilendirme</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAcceptEssential}
            className="text-muted-foreground/60 hover:text-foreground rounded-lg p-1 transition-colors"
            title="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Açıklama Metni */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Hilal Office olarak; güvenli oturum yönetimi, sistem performansının takibi ve kullanıcı deneyiminizi
          iyileştirmek amacıyla çerezler kullanmaktayız.
        </p>

        {/* Detaylı Tercihler (Açılır / Kapanır) */}
        {showDetails && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            {/* Zorunlu Çerezler */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-foreground">Zorunlu Oturum Çerezleri</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Supabase kimlik doğrulama ve veri güvenliği için şarttır. Devre dışı bırakılamaz.
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md shrink-0">
                Aktif
              </span>
            </div>

            <div className="h-px bg-border/40" />

            {/* Tercih Çerezleri */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">Tercih & Arayüz Çerezleri</span>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Tema, menü daraltma ve filtre tercihlerinizi hatırlar.
                </p>
              </div>
              <Switch
                checked={prefs.preferences}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, preferences: checked }))}
              />
            </div>

            <div className="h-px bg-border/40" />

            {/* Analitik Çerezler */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">Performans & Hata Takibi</span>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Sistem hızını artırmak ve olası hataları tespit etmek için anonim veri toplar.
                </p>
              </div>
              <Switch
                checked={prefs.analytics}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, analytics: checked }))}
              />
            </div>
          </div>
        )}

        {/* Aksiyon Butonları */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            {showDetails ? (
              <Button
                size="sm"
                onClick={handleSaveCustom}
                className="flex-1 h-8 text-xs font-medium gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Seçimleri Kaydet
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="flex-1 h-8 text-xs font-medium"
                >
                  Tümünü Kabul Et
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAcceptEssential}
                  className="flex-1 h-8 text-xs font-medium"
                >
                  Sadece Zorunlu
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((p) => !p)}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <Settings2 className="h-3 w-3" />
            <span>{showDetails ? "Tercihleri Gizle" : "Çerezleri Özelleştir"}</span>
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
