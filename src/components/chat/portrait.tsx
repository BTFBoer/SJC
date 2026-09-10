import { cn } from "@/lib/utils";
type Props = { size?: "sm" | "md" | "lg"; className?: string };
const sizes = { sm: "size-9", md: "size-11", lg: "size-28" };
export function Portrait({ size="md", className }: Props) { return <span className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full bg-elevated ring-1 ring-border", sizes[size], className)}><img src="/avatar.svg" alt="" className="size-full object-cover" draggable={false}/></span>; }
