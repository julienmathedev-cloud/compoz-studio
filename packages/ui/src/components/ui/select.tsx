"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import * as React from "react";

import { cn } from "@compoz/ui/lib/utils";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

type SelectVisualMode = "vanilla" | "studio";

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  visualMode = "vanilla",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
  visualMode?: SelectVisualMode;
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      data-visual-mode={visualMode}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border py-2 pr-2 pl-2.5 text-sm whitespace-nowrap outline-none select-none disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)]",
        "data-[visual-mode=vanilla]:border-input data-[visual-mode=vanilla]:bg-transparent data-[visual-mode=vanilla]:motion-safe:transition-colors data-[visual-mode=vanilla]:motion-reduce:transition-none data-[visual-mode=vanilla]:focus-visible:border-ring data-[visual-mode=vanilla]:focus-visible:ring-3 data-[visual-mode=vanilla]:focus-visible:ring-ring/50 data-[visual-mode=vanilla]:aria-invalid:border-destructive data-[visual-mode=vanilla]:aria-invalid:ring-3 data-[visual-mode=vanilla]:aria-invalid:ring-destructive/20 data-[visual-mode=vanilla]:data-placeholder:text-muted-foreground dark:data-[visual-mode=vanilla]:bg-input/30 dark:data-[visual-mode=vanilla]:hover:bg-input/50 dark:data-[visual-mode=vanilla]:aria-invalid:border-destructive/50 dark:data-[visual-mode=vanilla]:aria-invalid:ring-destructive/40",
        "data-[visual-mode=studio]:border-input data-[visual-mode=studio]:bg-transparent data-[visual-mode=studio]:data-[placeholder]:text-muted-foreground data-[visual-mode=studio]:motion-safe:transition-colors data-[visual-mode=studio]:motion-safe:focus-visible:ring-2 data-[visual-mode=studio]:motion-safe:focus-visible:ring-ring/70 data-[visual-mode=studio]:motion-safe:focus-visible:ring-offset-0 data-[visual-mode=studio]:aria-invalid:border-destructive data-[visual-mode=studio]:dark:aria-invalid:border-destructive/50 data-[visual-mode=studio]:aria-invalid:ring-destructive/60 data-[visual-mode=studio]:dark:aria-invalid:ring-destructive/40 data-[visual-mode=studio]:motion-safe:aria-invalid:ring-2 data-[visual-mode=studio]:motion-safe:focus-visible:aria-invalid:ring-destructive/60 data-[visual-mode=studio]:dark:motion-safe:focus-visible:aria-invalid:ring-destructive/40 data-[visual-mode=studio]:dark:bg-input/30 data-[visual-mode=studio]:motion-safe:dark:hover:bg-input/50",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  visualMode = "vanilla",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  visualMode?: SelectVisualMode;
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-visual-mode={visualMode}
        data-align-trigger={position === "item-aligned"}
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto bg-popover text-popover-foreground motion-reduce:transition-none motion-reduce:animate-none",
          "data-[visual-mode=vanilla]:rounded-lg data-[visual-mode=vanilla]:shadow-md data-[visual-mode=vanilla]:ring-1 data-[visual-mode=vanilla]:ring-foreground/10 data-[visual-mode=vanilla]:data-[align-trigger=true]:animate-none data-[visual-mode=vanilla]:motion-safe:data-[side=bottom]:slide-in-from-top-2 data-[visual-mode=vanilla]:motion-safe:data-[side=left]:slide-in-from-right-2 data-[visual-mode=vanilla]:motion-safe:data-[side=right]:slide-in-from-left-2 data-[visual-mode=vanilla]:motion-safe:data-[side=top]:slide-in-from-bottom-2 data-[visual-mode=vanilla]:motion-safe:data-open:animate-in data-[visual-mode=vanilla]:motion-safe:data-open:fade-in-0 data-[visual-mode=vanilla]:motion-safe:data-open:zoom-in-95 data-[visual-mode=vanilla]:motion-safe:data-closed:animate-out data-[visual-mode=vanilla]:motion-safe:data-closed:fade-out-0 data-[visual-mode=vanilla]:motion-safe:data-closed:zoom-out-95",
          "data-[visual-mode=studio]:rounded-lg data-[visual-mode=studio]:shadow-md data-[visual-mode=studio]:ring-1 data-[visual-mode=studio]:ring-foreground/10 data-[visual-mode=studio]:motion-safe:data-open:animate-in data-[visual-mode=studio]:motion-safe:data-closed:animate-out data-[visual-mode=studio]:motion-safe:data-closed:fade-out-0 data-[visual-mode=studio]:motion-safe:data-open:fade-in-0 data-[visual-mode=studio]:motion-safe:data-closed:zoom-out-95 data-[visual-mode=studio]:motion-safe:data-open:zoom-in-95 data-[visual-mode=studio]:motion-safe:data-[side=bottom]:slide-in-from-top-2 data-[visual-mode=studio]:motion-safe:data-[side=left]:slide-in-from-right-2 data-[visual-mode=studio]:motion-safe:data-[side=right]:slide-in-from-left-2 data-[visual-mode=studio]:motion-safe:data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[visual-mode=vanilla]:motion-safe:data-[side=bottom]:translate-y-1 data-[visual-mode=vanilla]:motion-safe:data-[side=left]:-translate-x-1 data-[visual-mode=vanilla]:motion-safe:data-[side=right]:translate-x-1 data-[visual-mode=vanilla]:motion-safe:data-[side=top]:-translate-y-1 data-[visual-mode=studio]:motion-safe:data-[side=bottom]:translate-y-1 data-[visual-mode=studio]:motion-safe:data-[side=left]:-translate-x-1 data-[visual-mode=studio]:motion-safe:data-[side=right]:translate-x-1 data-[visual-mode=studio]:motion-safe:data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            "data-[position=popper]:h-[var(--radix-select-trigger-height)] data-[position=popper]:w-full data-[position=popper]:min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  visualMode = "vanilla",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & {
  visualMode?: SelectVisualMode;
}) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      data-visual-mode={visualMode}
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        "data-[visual-mode=vanilla]:focus:bg-accent data-[visual-mode=vanilla]:focus:text-accent-foreground data-[visual-mode=vanilla]:not-data-[variant=destructive]:focus:**:text-accent-foreground",
        "data-[visual-mode=studio]:motion-safe:focus:bg-accent data-[visual-mode=studio]:motion-safe:focus:text-accent-foreground data-[visual-mode=studio]:not-data-[variant=destructive]:focus:**:text-accent-foreground",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
