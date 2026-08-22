"use client";

import * as React from "react";
import { Info, HelpCircle, AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface HelpInfoProps {
  /** Bilgi başlığı */
  title?: React.ReactNode;
  /** Detaylı açıklama içeriği */
  description: React.ReactNode;
  /** Renk teması */
  variant?: "default" | "info" | "warning" | "success";
  /** İkon tipi */
  iconType?: "info" | "help";
  /** Boyut: sm (14px), md (16px), lg (18px) */
  size?: "sm" | "md" | "lg";
  /** Popover yönü */
  side?: "top" | "bottom" | "left" | "right";
  /** Hizalama */
  align?: "start" | "center" | "end";
  /** Ekstra CSS sınıfları */
  className?: string;
}

const VARIANT_ICONS = {
  default: Info,
  info: Info,
  warning: AlertCircle,
  success: CheckCircle2,
};

const VARIANT_COLORS = {
  default: "text-muted-foreground/70 hover:text-foreground",
  info: "text-blue-500 hover:text-blue-600 dark:text-blue-400",
  warning: "text-amber-500 hover:text-amber-600 dark:text-amber-400",
  success: "text-emerald-500 hover:text-emerald-600 dark:text-emerald-400",
};

export function HelpInfo({
  title,
  description,
  variant = "default",
  iconType = "info",
  size = "sm",
  side = "top",
  align = "center",
  className,
}: HelpInfoProps) {
  const [open, setOpen] = React.useState(false);

  const Icon =
    iconType === "help"
      ? HelpCircle
      : VARIANT_ICONS[variant] || Info;

  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-4.5 w-4.5",
  }[size];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(props) => (
          <button
            {...props}
            type="button"
            aria-label="Bilgi"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((p) => !p);
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className={cn(
              "inline-flex items-center justify-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 cursor-pointer",
              VARIANT_COLORS[variant],
              className
            )}
          >
            <Icon className={sizeClasses} />
          </button>
        )}
      />
      <PopoverContent
        side={side}
        align={align}
        sideOffset={6}
        className="w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border/70 bg-popover/95 p-3.5 text-popover-foreground shadow-xl backdrop-blur-md z-50 animate-in fade-in-0 zoom-in-95 duration-150"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="space-y-1.5">
          {title && (
            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground leading-none">
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{title}</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground/60 hover:text-foreground sm:hidden p-0.5 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="text-xs text-muted-foreground leading-relaxed font-normal">
            {description}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
