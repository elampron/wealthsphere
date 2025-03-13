import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * @deprecated This file is deprecated. Import from '@/lib/utils' instead.
 * The cn function is now located in src/lib/utils.ts
 * This file is kept for backward compatibility only.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
