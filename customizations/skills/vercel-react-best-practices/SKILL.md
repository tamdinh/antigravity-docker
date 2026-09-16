---
name: vercel-react-best-practices
description: >-
  React and Next.js performance optimization guidelines from Vercel Engineering. Use when writing, reviewing, or refactoring React/Next.js code to ensure optimal component architecture, bundle size, data fetching patterns, and Core Web Vitals.
---

# React & Next.js Performance Best Practices

Official performance and architectural guidelines from Vercel Engineering for high-performance React and Next.js applications.

## Core Principles

### 1. Server Components by Default (RSC)
- Keep components as Server Components unless interactivity is strictly required.
- Benefits: Zero client bundle overhead, direct database access, reduced client-side JavaScript execution.
- Only add `'use client'` when using:
  - React state hooks (`useState`, `useReducer`).
  - Lifecycle effects (`useEffect`, `useLayoutEffect`).
  - Browser DOM listeners (`onClick`, `onChange`, `window`, `document`).
  - Custom client hooks relying on context or browser state.

### 2. Push `'use client'` to the Leaves
- Never mark entire pages or large container components with `'use client'`.
- Pass Server Components as children or props into Client Components:
  ```tsx
  // Good: Modal (Client) wraps ServerContent (Server)
  <ModalDialog>
    <ServerUserFeed />
  </ModalDialog>
  ```

### 3. Data Fetching Patterns
- Fetch data in parallel rather than sequential waterfalls:
  ```tsx
  // Parallel fetching with Promise.all
  const [userData, postsData] = await Promise.all([
    getUser(userId),
    getPosts(userId)
  ]);
  ```
- Wrap slower data-dependent components with `<Suspense fallback={<Skeleton />}>` to enable progressive streaming.

### 4. Optimize Bundle & Dynamic Imports
- Lazily load heavy client components or libraries that are not needed on initial render:
  ```tsx
  import dynamic from 'next/dynamic';
  const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
    ssr: false,
    loading: () => <EditorSkeleton />
  });
  ```

### 5. Media & Asset Optimization
- Use `next/image` for automatic WebP/AVIF formatting, responsive sizing, and lazy loading:
  ```tsx
  import Image from 'next/image';
  <Image src="/hero.png" alt="Hero" width={800} height={400} priority />
  ```
  *(Mark above-the-fold images with `priority` to improve Largest Contentful Paint - LCP).*
- Use `next/font` for zero-layout-shift font optimization and automatic self-hosting:
  ```tsx
  import { Inter } from 'next/font/google';
  const inter = Inter({ subsets: ['latin'], display: 'swap' });
  ```

### 6. Interaction to Next Paint (INP) & State Management
- Avoid unnecessary re-renders in client trees:
  - Split large contexts into smaller, granular providers.
  - Wrap non-urgent state updates with `React.startTransition()` to keep UI responsive.
  - Avoid boolean prop proliferation by using compound components or composable primitives.
