import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("animate-pulse bg-zinc-800", className)} {...props} />;
}

export { Skeleton };
