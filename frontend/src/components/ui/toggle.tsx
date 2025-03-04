'use client';

import * as TogglePrimitive from '@radix-ui/react-toggle';
import * as React from 'react';
import { tv, VariantProps } from 'tailwind-variants';

import { cn } from '@/lib/utils';

const toggleVariants = tv({
  base: [
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    'hover:bg-purple-50 dark:hover:bg-purple-900 data-[state=on]:bg-purple-50 dark:data-[state=on]:bg-purple-900',
  ],
  variants: {
    variant: {
      default: 'bg-transparent',
      outline:
        'border border-input bg-transparent shadow-xs hover:bg-purple-50 dark:hover:bg-purple-900 hover:text-accent-foreground',
    },
    size: {
      default: 'h-9 px-2 min-w-9',
      sm: 'h-8 px-1.5 min-w-8',
      lg: 'h-10 px-2.5 min-w-10',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      className={cn(toggleVariants({ variant, size, className }))}
      data-slot="toggle"
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
