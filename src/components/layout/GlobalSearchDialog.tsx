"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search, Users, Receipt, Building2, LayoutDashboard, DollarSign,
  ClipboardList, FileText, Settings, Plus, Loader2, ArrowRight,
  Clock, Sparkles, X, ChevronRight, CornerDownLeft, Ship
} from "lucide-react";
import {
  CommandDialog,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { globalAra, type SearchResultItem } from "@/app/actions/search";

const QUICK_PAGES = [
  { id: "page-dashboard", title: "Dashboard", subtitle: "Genel özet ve istatistikler", icon: LayoutDashboard, url: "/dashboard", group: "Sayfalar" },
  { id: "page-personel", title: "Personel Listesi", subtitle: "Çalışanlar ve özlük dosyaları", icon: Users, url: "/personel", group: "Sayfalar" },
  { id: "page-personel-yeni", title: "Yeni Personel Ekle", subtitle: "Hızlı çalışan kaydı oluştur", icon: Plus, url: "/personel/yeni", group: "Hızlı Aksiyonlar" },
  { id: "page-bordro", title: "Bordro", subtitle: "Maaş hesaplama ve banka listesi", icon: DollarSign, url: "/bordro", group: "Sayfalar" },
  { id: "page-puantaj", title: "Puantaj", subtitle: "Günlük mesai ve şantiye takibi", icon: ClipboardList, url: "/puantaj", group: "Sayfalar" },
  { id: "page-cari", title: "Cari Belgeler", subtitle: "Faturalar ve ödemeler", icon: Receipt, url: "/cari", group: "Sayfalar" },
  { id: "page-cari-yeni", title: "Yeni Belge / Fatura Ekle", subtitle: "Cari alacak veya fatura kaydı", icon: Plus, url: "/cari/belge/yeni", group: "Hızlı Aksiyonlar" },
  { id: "page-evrak", title: "Evrak Arşivi", subtitle: "Şirket ve tersane dokümanları", icon: FileText, url: "/evrak", group: "Sayfalar" },
  { id: "page-ayarlar", title: "Ayarlar", subtitle: "Şirket ve sistem parametreleri", icon: Settings, url: "/ayarlar", group: "Sayfalar" },
];

const RECENT_KEY = "hilal_recent_searches_v1";

export function GlobalSearchDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [inputText, setInputText] = React.useState("");
  const [submittedQuery, setSubmittedQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<Array<{ title: string; url: string; type: string }>>([]);

  // 1. Kısayol Dinleyicisi (⌘K / Ctrl+K) & Custom Event
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleOpenEvent = () => setOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-global-search", handleOpenEvent);

    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-global-search", handleOpenEvent);
    };
  }, []);

  // 2. Arama Tetikleyici (Sadece Enter veya Butona basılınca çalışır)
  const performSearch = async (searchTerm: string) => {
    const query = searchTerm.trim();
    if (!query) {
      setSubmittedQuery("");
      setResults([]);
      setHasSearched(false);
      return;
    }

    setSubmittedQuery(query);
    setLoading(true);
    setHasSearched(true);

    try {
      const res = await globalAra(query);
      if (res.basarili) {
        setResults(res.sonuclar);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Search execution error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(inputText);
  };

  const handleSelect = (url: string, title?: string, type?: string) => {
    setOpen(false);
    setInputText("");
    setSubmittedQuery("");
    setResults([]);
    setHasSearched(false);

    if (title && url) {
      const updated = [
        { title, url, type: type || "sayfa" },
        ...recentSearches.filter((r) => r.url !== url),
      ].slice(0, 5);
      setRecentSearches(updated);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    router.push(url);
  };

  const handleClear = () => {
    setInputText("");
    setSubmittedQuery("");
    setResults([]);
    setHasSearched(false);
  };

  const personelResults = results.filter((r) => r.type === "personel");
  const cariResults = results.filter((r) => r.type === "cari");
  const firmaResults = results.filter((r) => r.type === "firma");
  const projeResults = results.filter((r) => r.type === "proje");
  const evrakResults = results.filter((r) => r.type === "evrak");

  return (
    <CommandDialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          handleClear();
        }
      }}
      shouldFilter={false}
      title="Genel Arama"
      description="Personel, faturalar, firmalar veya sayfalar arasında arama yapın"
      className="max-w-2xl border-border/80 shadow-2xl backdrop-blur-2xl rounded-2xl overflow-hidden"
    >
      {/* Arama Formu (Harf harf değil, Enter ile arar) */}
      <form onSubmit={handleFormSubmit} className="flex items-center px-3.5 border-b border-border/50 bg-muted/20">
        <Search className="w-4 h-4 text-muted-foreground shrink-0 mr-2" />
        <input
          type="search"
          enterKeyHint="search"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (!e.target.value) {
              setSubmittedQuery("");
              setResults([]);
              setHasSearched(false);
            }
          }}
          placeholder="Personel adı, TC, fatura no, gemi, firma ara... (Aramak için Enter)"
          className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground/60 text-foreground"
          autoFocus
        />
        <div className="flex items-center gap-1.5 shrink-0">
          {loading ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : inputText ? (
            <>
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                title="Temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
              >
                Ara
              </button>
            </>
          ) : (
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>
      </form>

      <CommandList className="max-h-[380px] p-2 space-y-2 overflow-y-auto no-scrollbar">
        {/* Arama Yapılmamışken: Hızlı Kısayollar ve Son Arananlar */}
        {!hasSearched && (
          <>
            {recentSearches.length > 0 && (
              <CommandGroup heading="Son Arananlar">
                {recentSearches.map((item, idx) => (
                  <CommandItem
                    key={idx}
                    value={`recent-${item.url}`}
                    onSelect={() => handleSelect(item.url, item.title, item.type)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-semibold text-foreground truncate">{item.title}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Hızlı İşlemler">
              {QUICK_PAGES.filter((p) => p.group === "Hızlı Aksiyonlar").map((p) => {
                const Icon = p.icon;
                return (
                  <CommandItem
                    key={p.id}
                    value={p.title}
                    onSelect={() => handleSelect(p.url, p.title, "action")}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.subtitle}</p>
                      </div>
                    </div>
                    <CornerDownLeft className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandGroup heading="Sayfalar & Modüller">
              {QUICK_PAGES.filter((p) => p.group === "Sayfalar").map((p) => {
                const Icon = p.icon;
                return (
                  <CommandItem
                    key={p.id}
                    value={p.title}
                    onSelect={() => handleSelect(p.url, p.title, "page")}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate">{p.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50">{p.url}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {/* Arama Sonuçları */}
        {hasSearched && (
          <>
            {results.length === 0 && !loading && (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground/80">&quot;{submittedQuery}&quot; için sonuç bulunamadı</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Personel adı, fatura no veya firma adını kontrol edin.</p>
              </div>
            )}

            {/* Personel Grubu */}
            {personelResults.length > 0 && (
              <CommandGroup heading={`Personeller (${personelResults.length})`}>
                {personelResults.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle || ""} ${item.id}`}
                    onSelect={() => handleSelect(item.url, item.title, item.type)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                        {item.subtitle && <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>}
                      </div>
                    </div>
                    {item.meta && <span className="text-[10px] font-mono text-muted-foreground/70 shrink-0">{item.meta}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Cari Belgeler & Faturalar Grubu */}
            {cariResults.length > 0 && (
              <CommandGroup heading={`Cari Belgeler & Faturalar (${cariResults.length})`}>
                {cariResults.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle || ""} ${item.id}`}
                    onSelect={() => handleSelect(item.url, item.title, item.type)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                        {item.subtitle && <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {item.meta && <p className="text-xs font-bold text-foreground font-mono">{item.meta}</p>}
                      {item.badge && <span className="text-[9px] font-bold text-primary uppercase">{item.badge}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Firmalar Grubu */}
            {firmaResults.length > 0 && (
              <CommandGroup heading={`Firmalar (${firmaResults.length})`}>
                {firmaResults.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle || ""} ${item.id}`}
                    onSelect={() => handleSelect(item.url, item.title, item.type)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                        {item.subtitle && <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>}
                      </div>
                    </div>
                    {item.meta && <span className="text-[10px] text-muted-foreground/70">{item.meta}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Projeler & Gemiler Grubu */}
            {projeResults.length > 0 && (
              <CommandGroup heading={`Projeler & Gemiler (${projeResults.length})`}>
                {projeResults.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle || ""} ${item.id}`}
                    onSelect={() => handleSelect(item.url, item.title, item.type)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Ship className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                        {item.subtitle && <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>}
                      </div>
                    </div>
                    {item.meta && <span className="text-[10px] text-muted-foreground/70">{item.meta}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Evrak Arşivi Grubu */}
            {evrakResults.length > 0 && (
              <CommandGroup heading={`Evraklar (${evrakResults.length})`}>
                {evrakResults.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle || ""} ${item.id}`}
                    onSelect={() => handleSelect(item.url, item.title, item.type)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                        {item.subtitle && <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>}
                      </div>
                    </div>
                    {item.badge && <span className="text-[9px] font-bold text-sky-600 uppercase">{item.badge}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>

      {/* Modal Alt Bilgi Çubuğu */}
      <div className="px-4 py-2 border-t border-border/40 bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="h-4 px-1 rounded bg-background border border-border/60 text-[9px] flex items-center justify-center font-mono">Enter ↵</kbd>
            <span>Ara</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="h-4 min-w-[16px] px-1 rounded bg-background border border-border/60 text-[9px] flex items-center justify-center font-mono">↑</kbd>
            <kbd className="h-4 min-w-[16px] px-1 rounded bg-background border border-border/60 text-[9px] flex items-center justify-center font-mono">↓</kbd>
            <span>Gezin</span>
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/60">Hilal Office</span>
      </div>
    </CommandDialog>
  );
}
