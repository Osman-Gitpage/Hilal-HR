const stats = [
  { value: "10.000+", label: "Aktif Personel Kaydı" },
  { value: "500+", label: "Entegre Firma" },
  { value: "99.9%", label: "Platform Çalışma Süresi" },
  { value: "3 dk", label: "Ortalama Kurulum Süresi" },
];

export default function LandingStats() {
  return (
    <section id="istatistikler" className="border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`py-12 px-6 flex flex-col gap-1 ${i < stats.length - 1 ? "border-r border-zinc-800" : ""}`}
            >
              <div className="text-4xl font-bold text-white tracking-tight">{s.value}</div>
              <div className="text-sm text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
