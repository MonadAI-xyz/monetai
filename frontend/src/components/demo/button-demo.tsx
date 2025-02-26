import { Button } from '@/components/ui/button';

export const ButtonDemo = () => {
  return (
    <div className="flex flex-row flex-wrap items-center gap-4">
      <Button>Button</Button>
      <Button variant="secondary">Button</Button>
      <Button variant="destructive">Button</Button>
      <Button variant="outline">Button</Button>
      <Button variant="ghost">Button</Button>
      <Button variant="link">Button</Button>
      <Button variant="cta-solid">Button</Button>
      <Button variant="cta-gradient">Button</Button>
    </div>
  );
};
