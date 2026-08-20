"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SystemNotificationListener } from "@/components/layout/SystemNotificationListener";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const asciiLogo = `
  ██╗  ██╗ ██╗ ██╗      █████╗  ██╗     
  ██║  ██║ ██║ ██║     ██╔══██╗ ██║     
  ███████║ ██║ ██║     ███████║ ██║     
  ██╔══██║ ██║ ██║     ██╔══██║ ██║     
  ██║  ██║ ██║ ███████╗██║  ██║ ███████╗
  ╚═╝  ╚═╝ ╚═╝ ╚══════╝╚═╝  ╚═╝ ╚══════╝

  ██████╗  ███████╗ ███████╗ ██╗  ██████╗  ███████╗
 ██╔═══██╗ ██╔════╝ ██╔════╝ ██║ ██╔════╝  ██╔════╝
 ██║   ██║ █████╗   █████╗   ██║ ██║       █████╗  
 ██║   ██║ ██╔══╝   ██╔══╝   ██║ ██║       ██╔══╝  
 ╚██████╔╝ ██║      ██║      ██║ ╚██████╗  ███████╗
  ╚═════╝  ╚═╝      ╚═╝      ╚═╝  ╚═════╝  ╚══════╝
      `;

      console.log(
        `%c${asciiLogo}`,
        "font-family: monospace; font-weight: bold; color: #10B981; text-shadow: 0 0 10px rgba(16, 185, 129, 0.4);"
      );
      console.log(
        "%c 🚀 HILAL OFFICE %c v2.5.0 %c İnsan Kaynakları & Bordro Platformu ",
        "background: #09090b; color: #10B981; font-weight: bold; padding: 6px 12px; border-radius: 6px 0 0 6px; font-size: 12px; border: 1px solid #27272a;",
        "background: #10B981; color: #09090b; font-weight: bold; padding: 6px 12px; font-size: 12px;",
        "background: #18181b; color: #a1a1aa; font-weight: 500; padding: 6px 12px; border-radius: 0 6px 6px 0; font-size: 12px; border: 1px solid #27272a;"
      );
      console.log(
        "%c⚡ Kurumsal Dijital Muhasebe & İK Sistemine Hoş Geldiniz. Güvenli Oturum Aktif.",
        "color: #71717a; font-size: 11px; font-style: italic; margin-top: 4px; font-family: sans-serif;"
      );
    }
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 dakika
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SystemNotificationListener />
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster position="bottom-right" richColors closeButton />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
