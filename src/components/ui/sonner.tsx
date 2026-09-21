"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle2, Info, AlertTriangle, OctagonX, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      richColors={false}
      closeButton={true}
      duration={3500}
      visibleToasts={5}
      offset="16px"
      gap={10}
      icons={{
        success: (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
            <CheckCircle2 className="size-4 stroke-[2.2]" />
          </span>
        ),
        info: (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 shadow-xs">
            <Info className="size-4 stroke-[2.2]" />
          </span>
        ),
        warning: (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-xs">
            <AlertTriangle className="size-4 stroke-[2.2]" />
          </span>
        ),
        error: (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 shadow-xs">
            <OctagonX className="size-4 stroke-[2.2]" />
          </span>
        ),
        loading: (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Loader2 className="size-4 animate-spin stroke-[2.2]" />
          </span>
        ),
        close: (
          <X className="size-3.5 stroke-[2]" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: cn(
            "group toast w-full max-w-[380px] sm:max-w-[420px] rounded-2xl p-3.5 gap-3 shadow-xl backdrop-blur-xl border select-none transition-all duration-300 items-start",
            "bg-card/95 text-card-foreground border-border/80",
            "dark:bg-card/95 dark:border-white/10 dark:text-card-foreground dark:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)]"
          ),
          success: "!border-emerald-500/30 dark:!border-emerald-500/25 !bg-gradient-to-r !from-emerald-500/[0.08] !via-card !to-card ring-1 ring-emerald-500/20",
          error: "!border-rose-500/30 dark:!border-rose-500/25 !bg-gradient-to-r !from-rose-500/[0.08] !via-card !to-card ring-1 ring-rose-500/20",
          warning: "!border-amber-500/30 dark:!border-amber-500/25 !bg-gradient-to-r !from-amber-500/[0.08] !via-card !to-card ring-1 ring-amber-500/20",
          info: "!border-sky-500/30 dark:!border-sky-500/25 !bg-gradient-to-r !from-sky-500/[0.08] !via-card !to-card ring-1 ring-sky-500/20",
          loading: "!border-primary/25 !bg-card ring-1 ring-primary/20",
          icon: "!h-auto !w-auto !size-auto !mr-0 self-start !mt-0 flex items-center justify-center shrink-0",
          content: "flex-1 min-w-0 pr-4 flex flex-col justify-center",
          title: "text-[13.5px] font-semibold text-foreground tracking-tight leading-snug break-words",
          description: "text-xs text-muted-foreground/90 font-normal leading-relaxed mt-0.5 break-words",
          actionButton: "text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs",
          cancelButton: "text-xs font-medium px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors",
          closeButton: "!absolute !left-auto !right-2.5 !top-2.5 !transform-none !h-6 !w-6 !p-0 rounded-lg !bg-transparent hover:!bg-muted/80 text-muted-foreground/60 hover:text-foreground !border-none transition-colors flex items-center justify-center cursor-pointer opacity-70 hover:opacity-100",
          ...props.toastOptions?.classNames,
        },
        ...props.toastOptions,
      }}
      {...props}
    />
  )
}

export { Toaster }
