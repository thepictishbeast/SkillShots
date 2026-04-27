import { z } from 'zod';

// Cursor pagination only — offset paging is unsafe at scale (skewing under writes).
export const PageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    // Opaque cursor; null means end-of-list.
    nextCursor: z.string().nullable(),
  });

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};
