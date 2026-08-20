import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// .env.local dosyasından Supabase URL ve Key yükle
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ HATA: .env.local dosyasında Supabase bilgileri bulunamadı!");
  process.exit(1);
}

// Argüman ayrıştırma
const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return fallback;
}

const hasBakimFlag = args.includes("--bakim") || args.includes("--bakimModu");

const tip = (getArg("tip", "uyari") as "bilgi" | "uyari" | "bakim" | "guncelleme");
const baslik = getArg("baslik", hasBakimFlag ? "Sistem Bakım Uyarısı" : "Sistem Bildirimi");
const mesaj = getArg(
  "mesaj",
  hasBakimFlag
    ? "Sistem bakıma alınmaktadır. Lütfen devam eden işlemlerinizi tamamlayın."
    : "Sistemde yeni güncellemeler yayınlandı."
);
const sure = parseInt(getArg("sure", "15000"), 10);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function Yayinla() {
  console.log("\n📡 Canlı Sisteme Broadcast Yayını Gönderiliyor...");
  console.log(`📌 Tip          : ${tip.toUpperCase()}`);
  console.log(`📌 Başlık       : ${baslik}`);
  console.log(`📌 Mesaj        : ${mesaj}`);
  console.log(`📌 Bakım Modu   : ${hasBakimFlag ? "EVET (Aktif)" : "HAYIR"}`);
  console.log(`📌 Ekranda Kalma : ${sure / 1000} saniye\n`);

  const channel = supabase.channel("sistem_duyurulari", {
    config: {
      broadcast: { ack: true },
    },
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      const sendResult = await channel.send({
        type: "broadcast",
        event: "CANLI_UYARI",
        payload: {
          tip,
          baslik,
          mesaj,
          sure,
          bakimModuAktif: hasBakimFlag,
          tarih: new Date().toISOString(),
        },
      });

      if (sendResult === "ok") {
        console.log("✅ BAŞARILI: Duyuru canlıdaki tüm aktif kullanıcılara anında iletildi!\n");
      } else {
        console.error("⚠️ UYARI: Broadcast gönderim durumu:", sendResult);
      }

      setTimeout(() => {
        supabase.removeChannel(channel);
        process.exit(0);
      }, 1000);
    }
  });
}

Yayinla();
