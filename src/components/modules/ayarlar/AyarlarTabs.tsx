"use client";

// ─── Ayarlar Sekmeleri (Modern Premium UI) ───────────────────────────────────

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, FolderTree } from "lucide-react";
import { EvrakKategoriAyarlar } from "./EvrakKategoriAyarlar";

interface AyarlarTabsProps {
  genelAyarlar: ReactNode;
}

export function AyarlarTabs({ genelAyarlar }: AyarlarTabsProps) {
  return (
    <Tabs defaultValue="genel" className="space-y-6">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-0">
        <TabsList className="bg-transparent h-auto p-0 gap-6">
          <TabsTrigger
            value="genel"
            className="flex items-center gap-2 pb-3 pt-1 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#7c3aed] data-[state=active]:text-[#7c3aed] data-[state=active]:bg-transparent text-xs sm:text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            Genel Ayarlar
          </TabsTrigger>
          <TabsTrigger
            value="evrak"
            className="flex items-center gap-2 pb-3 pt-1 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#7c3aed] data-[state=active]:text-[#7c3aed] data-[state=active]:bg-transparent text-xs sm:text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer"
          >
            <FolderTree className="h-4 w-4" />
            Evrak Kategorileri
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="genel" className="mt-0 focus-visible:outline-none">
        {genelAyarlar}
      </TabsContent>

      <TabsContent value="evrak" className="mt-0 focus-visible:outline-none">
        <EvrakKategoriAyarlar />
      </TabsContent>
    </Tabs>
  );
}
