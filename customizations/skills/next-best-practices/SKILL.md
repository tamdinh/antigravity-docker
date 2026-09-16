---
name: next-best-practices
description: >-
  Next.js App Router architecture and modern best practices. Use when designing Next.js routes, implementing Cache Components, configuring Partial Prerendering (PPR), writing Server Actions, or optimizing route segment configs.
---

# Next.js App Router & Cache Components Guide

Best practices for Next.js App Router, Partial Prerendering (PPR), Cache Components, and Server Actions.

## Routing & Directory Conventions
- **`app/layout.tsx`**: Root layout wrapping all pages. Keep it lightweight and shared.
- **`app/page.tsx`**: Route leaf component rendered at the URL.
- **`app/loading.tsx`**: Automatic Suspense boundary for the route segment.
- **`app/error.tsx`**: Client-side error boundary catching uncaught runtime exceptions in the segment (`'use client'`).
- **`app/not-found.tsx`**: Custom 404 handler for `notFound()` invocations.
- **`app/api/.../route.ts`**: API Route Handlers (`export async function GET(req) { ... }`).

---

## Cache Components (`use cache`)
Next.js 15/16 introduces the `'use cache'` directive for granular, composable caching of components and functions:

```tsx
// File or component-level caching
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';

export async function ProductDetails({ id }: { id: string }) {
  'use cache';
  cacheLife('hours'); // Set retention profile: seconds, minutes, hours, days, max
  cacheTag(`product-${id}`, 'products'); // Tag for invalidation

  const product = await db.products.findById(id);
  return <div>{product.name} - ${product.price}</div>;
}
```

### On-Demand Invalidation (`revalidateTag` & `updateTag`)
```ts
import { revalidateTag } from 'next/cache';

export async function updateProductAction(formData: FormData) {
  'use server';
  const id = formData.get('id');
  await db.products.update(...);
  
  // Revalidates all cached components with this tag
  revalidateTag(`product-${id}`);
}
```

---

## Partial Prerendering (PPR)
PPR combines static shell prerendering with dynamic streaming in the same route:
```ts
// next.config.ts
const nextConfig = {
  experimental: {
    ppr: 'incremental',
  },
};
```
In your route:
```tsx
// app/dashboard/page.tsx
export const experimental_ppr = true;

export default function DashboardPage() {
  return (
    <div>
      {/* Static Shell: Prerendered at build time */}
      <DashboardHeader />
      
      {/* Dynamic Hole: Streamed on request */}
      <Suspense fallback={<MetricsSkeleton />}>
        <DynamicUserMetrics />
      </Suspense>
    </div>
  );
}
```

---

## Server Actions Guidelines
1. **Always authenticate**: Never trust client claims in Server Actions. Verify session and permissions inside the action.
2. **Validate input**: Use Zod or Valibot to validate `FormData` or JSON inputs:
   ```ts
   'use server';
   import { z } from 'zod';

   const Schema = z.object({ title: z.string().min(3) });

   export async function createItem(prev: any, formData: FormData) {
     const parsed = Schema.safeParse({ title: formData.get('title') });
     if (!parsed.success) return { error: parsed.error.flatten() };
     // mutate database
   }
   ```
3. **Use with `useActionState`**: Combine Server Actions with React's `useActionState` for pending states and optimistic UI.
