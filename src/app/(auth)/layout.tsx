export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sol panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-zinc-800 relative overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #3f3f46 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            opacity: 0.3,
          }}
          aria-hidden
        />

        {/* Logo */}
        <a href="/" className="relative z-10 flex items-center gap-3 self-start">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="text-zinc-950 font-black text-base leading-none">H</span>
          </div>
          <span className="text-white font-semibold tracking-tight text-lg">Hilal İK</span>
        </a>

        {/* Center quote */}
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="text-xs font-semibold text-zinc-500 tracking-widest uppercase">
              Profesyonel İK Yönetimi
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Tüm ekibinizi
              <br />
              <span className="text-zinc-400">tek platformdan</span>
              <br />
              yönetin.
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
              Personel, bordro, puantaj ve cari hesap modülleriyle
              çok firmalı yapıyı eksiksiz yönetin.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-3">
            {[
              "Çok firmalı yapı desteği",
              "Otomatik bordro hesaplama",
              "Gerçek zamanlı puantaj takibi",
              "KVKK uyumlu veri yönetimi",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-zinc-400">
                <div className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-zinc-700">
          © {new Date().getFullYear()} Hilal İK. Tüm hakları saklıdır.
        </div>
      </div>

      {/* Sağ panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
