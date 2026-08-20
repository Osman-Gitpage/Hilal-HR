import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";

/**
 * src/app/api/pdf-proxy/route.ts
 * CORS engeline takılmadan S3/B2 presigned PDF dosyalarını güvenle stream eder.
 */

export async function GET(req: NextRequest) {
  try {
    // Oturum kontrolü
    await getAuthContext();

    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return new NextResponse("URL parametresi gereklidir.", { status: 400 });
    }

    // Harici URL'den PDF binary verisini sunucu tarafında çek
    const response = await fetch(url);
    if (!response.ok) {
      return new NextResponse(`Dosya alınamadı: ${response.statusText}`, {
        status: response.status,
      });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[pdf-proxy] Hata:", err);
    return new NextResponse(err?.message ?? "PDF proxy hatası", { status: 500 });
  }
}
