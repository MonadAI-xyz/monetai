import { GalleryVerticalEnd } from 'lucide-react';

import { ModeToggle } from '@/components/demo/toggle-mode';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute top-10 left-10 z-10 flex justify-center gap-2 md:justify-start">
          <a className="flex items-center gap-2 font-medium" href="#">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Acme Inc.
          </a>
        </div>
        <img
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
        />
        <div className="absolute inset-x-10 bottom-10 z-10 flex flex-col gap-2">
          <p className="text-foreground text-lg">
            “This library has saved me countless hours of work and helped me
            deliver stunning designs to my clients faster than ever before.”
          </p>
          <p className="text-foreground text-sm">Sofia Davis</p>
        </div>
      </div>
      <div className="relative flex flex-col gap-4 p-6 md:p-10">
        <div className="absolute top-10 right-10 z-10">
          <ModeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
