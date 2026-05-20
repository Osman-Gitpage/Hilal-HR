"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCariGenel } from "@/hooks/useCari";
import { paraFormat } from "@/lib/cari";
import type { ParaBirimi } from "@/types";

function DurumBadge({ durum }: { durum: string }) {
  if (durum === "odendi")
    return <Badge className="bg-emerald-500 text-white border-0 text-xs">Ödendi</Badge>;
  if (durum === "kismi")
    return <Badge className="bg-amber-500 text-white border-0 text-xs">Kısmi</Badge>;
  return <Badge variant="outline" className="border-red-400 text-red-500 text-xs">Ödenmedi</Badge>;
}

export function CariGenelView() {
  const router = useRouter();
  const [pb, setPb] = useState<ParaBirimi | "">("");
  const [arama, setArama] = useState("");

  const { data: satirlar = [], isLoading } = useCariGenel(pb || undefined);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtreli = (satirlar as any[]).filter((s: any) => {
    const q = arama.toLowerCase();
    return (
      !q ||
      s.belge_no.toLowerCase().includes(q) ||
      (s.gemi_ad ?? "").toLowerCase().includes(q) ||
      (s.ilgili_kisi_ad ?? "").toLowerCase().includes(q)
    );
  });

  type GenelSatir = typeof filtreli[number];
  const toplamAlacak = filtreli.reduce((s: number, r: GenelSatir) => s + r.genel_toplam, 0);
  const toplamKalan = filtreli.reduce((s: number, r: GenelSatir) => s + r.kalan, 0);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cari Genel</h1>
          <p className="text-muted-foreground mt-1">Tüm proforma ve faturaların özet görünümü.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/cari")} id="btn-gemi-listesi">
          Gemi Listesi
        </Button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Input
            placeholder="Belge, gemi veya kişi ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            id="input-genel-ara"
          />
        </div>
        <Select value={pb || undefined} onValueChange={(v) => setPb((v ?? "") as ParaBirimi | "")}>
          <SelectTrigger className="w-36" id="select-pb">
            <SelectValue placeholder="Para Birimi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tümü</SelectItem>
            <SelectItem value="TRY">TRY ₺</SelectItem>
            <SelectItem value="EUR">EUR €</SelectItem>
            <SelectItem value="USD">USD $</SelectItem>
          </SelectContent>
        </Select>
        {pb && (
          <div className="flex gap-4 ml-auto text-sm">
            <span>
              Toplam:{" "}
              <span className="font-semibold font-mono">
                {paraFormat(toplamAlacak, pb as ParaBirimi)}
              </span>
            </span>
            <span>
              Kalan:{" "}
              <span className="font-semibold font-mono text-destructive">
                {paraFormat(toplamKalan, pb as ParaBirimi)}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Tablo */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Belge No</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Tarih <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Gemi</TableHead>
              <TableHead>İlgili Kişi</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Kalan</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
              : filtreli.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      {arama || pb ? "Kriterlere uyan kayıt bulunamadı." : "Henüz belge yok."}
                    </TableCell>
                  </TableRow>
                )
                : filtreli.map((r: GenelSatir) => (
                  <TableRow
                    key={r.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => r.gemi_id && router.push(`/cari/${r.gemi_id}`)}
                  >
                    <TableCell className="font-mono text-sm">{r.belge_no}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.tarih}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {r.tur === "proforma" ? "Proforma" : "Fatura"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{r.gemi_ad ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {r.ilgili_kisi_ad ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {paraFormat(r.genel_toplam, r.para_birimi)}
                    </TableCell>
                    <TableCell><DurumBadge durum={r.odeme_durumu} /></TableCell>
                    <TableCell className="font-mono text-sm">
                      {r.kalan > 0 ? (
                        <span className="text-destructive">{paraFormat(r.kalan, r.para_birimi)}</span>
                      ) : (
                        <span className="text-emerald-600">—</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {r.gemi_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => router.push(`/cari/${r.gemi_id}`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
