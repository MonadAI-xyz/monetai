import { Loader2 } from "lucide-react";

export function Loader({ className, size = 16 }: { className?: string; size?: number }) {
  return <Loader2 className={`animate-spin ${className}`} size={size} />;
} 