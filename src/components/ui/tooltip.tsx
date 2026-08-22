"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "@/lib/utils"

function TooltipProvider({
  delay = 150,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-lg border border-border/40 bg-popover/95 px-3 py-1.5 text-xs text-popover-foreground shadow-md backdrop-blur-sm has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-1.5 data-[side=inline-end]:slide-in-from-left-1.5 data-[side=inline-start]:slide-in-from-right-1.5 data-[side=left]:slide-in-from-right-1.5 data-[side=right]:slide-in-from-left-1.5 data-[side=top]:slide-in-from-bottom-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border-b border-r border-border/40 bg-popover fill-popover data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

// ─── Rich Tooltip Bileşenleri ──────────────────────────────────────────────────

export interface RichTooltipContentProps
  extends Omit<TooltipPrimitive.Popup.Props, "title">,
    Pick<
      TooltipPrimitive.Positioner.Props,
      "align" | "alignOffset" | "side" | "sideOffset"
    > {
  title?: React.ReactNode
  description?: React.ReactNode
  shortcut?: string | string[]
  icon?: React.ReactNode
  badge?: string
  variant?: "default" | "info" | "warning" | "destructive" | "success"
}

const VARIANT_STYLES = {
  default: "border-border/50 bg-popover/95 text-popover-foreground",
  info: "border-blue-500/30 bg-blue-950/90 text-blue-100 dark:border-blue-500/40",
  warning: "border-amber-500/30 bg-amber-950/90 text-amber-100 dark:border-amber-500/40",
  destructive: "border-rose-500/30 bg-rose-950/90 text-rose-100 dark:border-rose-500/40",
  success: "border-emerald-500/30 bg-emerald-950/90 text-emerald-100 dark:border-emerald-500/40",
}

function RichTooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  title,
  description,
  shortcut,
  icon,
  badge,
  variant = "default",
  children,
  ...props
}: RichTooltipContentProps) {
  const shortcuts = shortcut
    ? Array.isArray(shortcut)
      ? shortcut
      : [shortcut]
    : []

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 min-w-[160px] max-w-xs rounded-xl border p-2.5 text-xs shadow-xl backdrop-blur-md transition-all",
            "data-[side=bottom]:slide-in-from-top-1.5 data-[side=inline-end]:slide-in-from-left-1.5 data-[side=inline-start]:slide-in-from-right-1.5 data-[side=left]:slide-in-from-right-1.5 data-[side=right]:slide-in-from-left-1.5 data-[side=top]:slide-in-from-bottom-1.5",
            "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            VARIANT_STYLES[variant],
            className
          )}
          {...props}
        >
          <div className="space-y-1.5">
            {(title || icon || badge || shortcuts.length > 0) && (
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 font-semibold text-[13px] leading-none">
                  {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
                  {title && <span>{title}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {badge && (
                    <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                      {badge}
                    </span>
                  )}
                  {shortcuts.map((sc, i) => (
                    <kbd
                      key={i}
                      className="inline-flex h-5 items-center justify-center rounded border border-border/60 bg-muted/60 px-1.5 font-mono text-[10px] font-semibold text-muted-foreground shadow-xs"
                    >
                      {sc}
                    </kbd>
                  ))}
                </div>
              </div>
            )}

            {description && (
              <p className="text-[11px] leading-relaxed text-muted-foreground font-normal">
                {description}
              </p>
            )}

            {children}
          </div>

          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border-b border-r border-border/40 bg-popover fill-popover" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

// ─── Hepsi Bir Arada (Convenience Wrapper) ───────────────────────────────────

export interface RichTooltipProps extends RichTooltipContentProps {
  children?: React.ReactNode
  trigger?: React.ReactNode
  delay?: number
}

function RichTooltip({
  children,
  trigger,
  title,
  description,
  shortcut,
  icon,
  badge,
  variant,
  side,
  sideOffset,
  align,
  alignOffset,
  className,
}: RichTooltipProps) {
  const triggerEl = trigger || children

  return (
    <Tooltip>
      <TooltipTrigger render={triggerEl ? <span className="inline-flex" /> : undefined}>
        {triggerEl}
      </TooltipTrigger>
      <RichTooltipContent
        title={title}
        description={description}
        shortcut={shortcut}
        icon={icon}
        badge={badge}
        variant={variant}
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className={className}
      />
    </Tooltip>
  )
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  RichTooltipContent,
  RichTooltip,
}

