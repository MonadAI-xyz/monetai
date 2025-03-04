import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { tv, VariantProps } from 'tailwind-variants';

import { cn } from '@/lib/utils';

const buttonVariants = tv({
  base: "inline-flex rounded-full items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all",
  variants: {
    variant: {
      default:
        'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
      destructive:
        'bg-destructive text-destructive-button-text shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
      outline:
        'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
      secondary:
        'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
      'cta-solid':
        'bg-purple-600 border border-purple-400 text-background dark:text-foreground shadow-sm hover:bg-purple-400',
      'cta-gradient':
        'bg-linear-[90deg,#6e54ff_39%,#b4a7fb_100%] border border-purple-400 text-background dark:text-foreground shadow-sm hover:bg-linear-[90deg,#9A89FA_0%,#9A89FA_100%]',
    },
    size: {
      default: 'h-9 px-4 py-2 has-[>svg]:px-3',
      sm: 'h-8 px-3 has-[>svg]:px-2.5',
      lg: 'h-10 px-6 has-[>svg]:px-4',
    },
    icon: {
      true: 'size-9 border border-input text-foreground bg-background rounded-md hover:bg-secondary',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    icon: false,
  },
});

function Button({
  className,
  variant,
  size,
  icon = false,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, icon, className }))}
      data-slot="button"
      {...props}
    />
  );
}

export { Button, buttonVariants };
