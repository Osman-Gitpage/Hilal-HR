"use client";

// ─── Ayarlar Sekmeleri ────────────────────────────────────────────────────────
// Genel ayarlar ve Evrak Kategorileri sekmelerini yöneten tab bileşeni

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, FileText } from "lucide-react";
import { EvrakKategoriAyarlar } from "./EvrakKategoriAyarlar";

interface AyarlarTabsProps {
  genelAyarlar: ReactNode;
}

export function AyarlarTabs({ genelAyarlar }: AyarlarTabsProps) {
  return (
    <Tabs defaultValue="genel" className="space-y-6">
      <TabsList>
        <TabsTrigger value="genel" className="gap-2">
          <Settings className="h-4 w-4" />
          Genel
        </TabsTrigger>
        <TabsTrigger value="evrak" className="gap-2">
          <FileText className="h-4 w-4" />
          Evrak Kategorileri
        </TabsTrigger>
      </TabsList>

      <TabsContent value="genel">
        {genelAyarlar}
      </TabsContent>

      <TabsContent value="evrak">
        <EvrakKategoriAyarlar />
      </TabsContent>
    </Tabs>
  );
}
