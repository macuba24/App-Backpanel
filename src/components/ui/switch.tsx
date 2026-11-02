"use client"

import * as React from "react"
import { cn } from "cn"
import { Switch as SwitchPrimitive } from "radix-ui"

import { useT } from "@/lib/locale"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  const on = props.checked === true;
  const t = useT();

  return (
    <span className="inline-flex items-center gap-2">
      <SwitchPrimitive.Root
        data-slot="switch"
        data-size={size}
        className={cn(
          "peer group/switch relative inline-flex shrink-0 rounded-full border-2 border-black bg-zinc-500 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-black/30 data-[state=checked]:bg-[#2dd4bf] data-disabled:cursor-not-allowed data-disabled:opacity-50",
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className="pointer-events-none rounded-full border-2 border-black bg-white shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
        />
      </SwitchPrimitive.Root>
      <span aria-hidden className={cn("text-xs font-bold tracking-wide uppercase", on ? "text-zinc-950" : "text-zinc-600")}>
        {on ? t("Ein", "On") : t("Aus", "Off")}
      </span>
    </span>
  )
}

export { Switch }
