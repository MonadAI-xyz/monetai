import Image from 'next/image';

import { AspectRatio } from '@/components/ui/aspect-ratio';

export function AspectRatioDemo() {
  return (
    <AspectRatio className="bg-muted" ratio={16 / 9}>
      <Image
        fill
        alt="Photo by Drew Beamer"
        className="h-full w-full rounded-md object-cover"
        src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
      />
    </AspectRatio>
  );
}
