import Link from "next/link";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "Özellikler", href: "#ozellikler" },
      { label: "Modüller", href: "#moduller" },
      { label: "İstatistikler", href: "#istatistikler" },
      { label: "Referanslar", href: "#referanslar" },
    ],
  },
  {
    title: "Hesap",
    links: [
      { label: "Giriş Yap", href: "/giris" },
      { label: "Kayıt Ol", href: "/kayit" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "Gizlilik Politikası", href: "#" },
      { label: "Kullanım Koşulları", href: "#" },
      { label: "KVKK Aydınlatma", href: "#" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top */}
        <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-zinc-800">
          {/* Brand */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5 self-start">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-zinc-950 font-black text-sm">H</span>
              </div>
              <span className="text-white font-semibold tracking-tight">Hilal İK</span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Profesyonel çok firmalı İnsan Kaynakları ve Bordro Yönetim Sistemi.
            </p>
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 self-start border border-zinc-800 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-zinc-500">Tüm sistemler aktif</span>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <div className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">
                {group.title}
              </div>
              <div className="flex flex-col gap-3">
                {group.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Hilal İK. Tüm hakları saklıdır.
          </span>
          <span className="text-xs text-zinc-700">
            Türkiye&apos;de tasarlandı ve geliştirildi 🇹🇷
          </span>
        </div>
      </div>
    </footer>
  );
}
