"use client";

import Image from "next/image";
import Link from "next/link";
import { Arac } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface GarajCardProps {
  arac: Arac;
  onDuzenle?: (arac: Arac) => void;
  onSil?: (arac: Arac) => void;
}

export function GarajCard({ arac, onDuzenle, onSil }: GarajCardProps) {
  return (
    <div className="group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-1">
      {/* ── Üst Bilgi Barı ── */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <Link href={`/garaj/${arac.id}`} className="space-y-0.5 flex-1 min-w-0">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-primary transition-colors truncate">
            {arac.marka} {arac.model}
          </h3>
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 truncate">
            {arac.yakitTipi} • {arac.vites} {arac.paket ? `• ${arac.paket}` : ""}
          </p>
        </Link>

        {/* Aksiyon Menüsü (Düzenle / Sil) */}
        <div className="relative z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors outline-none cursor-pointer"
              title="Araç İşlemleri"
            >
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-2xl p-1 text-xs">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuzenle?.(arac);
                }}
                className="flex items-center gap-2 cursor-pointer rounded-xl py-1.5"
              >
                <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSil?.(arac);
                }}
                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 rounded-xl py-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Araç Görsel Alanı (Tıklanabilir) ── */}
      <Link
        href={`/garaj/${arac.id}`}
        className="relative w-full h-48 my-3 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-50/50 to-zinc-100/40 dark:from-zinc-900/50 dark:to-zinc-800/30"
      >
        <Image
          src={arac.gorsel}
          alt={`${arac.marka} ${arac.model}`}
          fill
          className="object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={arac.gorsel.startsWith("http")}
        />
      </Link>

      {/* ── Alt Bilgi Şeridi (Sol: Model Yılı | Orta: Plaka | Sağ: KM) ── */}
      <Link
        href={`/garaj/${arac.id}`}
        className="grid grid-cols-3 gap-2 pt-4 mt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-center items-center"
      >
        {/* Sol: Model Yılı */}
        <div className="space-y-0.5">
          <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
            {arac.yil}
          </p>
          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Model Yılı
          </p>
        </div>

        {/* Orta: Plaka */}
        <div className="space-y-0.5 border-x border-zinc-100 dark:border-zinc-800/80 px-1">
          <p className="font-mono font-bold text-sm text-zinc-800 dark:text-zinc-200 tracking-wide">
            {arac.plaka}
          </p>
          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Plaka
          </p>
        </div>

        {/* Sağ: Kilometre */}
        <div className="space-y-0.5">
          <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
            {arac.km.toLocaleString("tr-TR")} km
          </p>
          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Kilometre
          </p>
        </div>
      </Link>
    </div>
  );
}
