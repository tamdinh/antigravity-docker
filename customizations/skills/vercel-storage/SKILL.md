---
name: vercel-storage
description: >-
  Integrate and manage Vercel Storage solutions including Vercel Blob (file uploads), Neon Postgres (relational database), and Upstash Redis (caching and rate limiting). Use when adding storage, file uploads, database, or caching to Vercel projects.
---

# Vercel Storage Guide

Guide to integrating and managing storage, databases, and caches in Vercel applications.

---

## 1. Vercel Blob (File & Media Storage)
Fast, scalable object storage for files, images, PDFs, and media uploads.

### Installation
```bash
npm install @vercel/blob
```

### Server Upload
```ts
import { put } from '@vercel/blob';

export async function uploadFile(file: File) {
  const blob = await put(file.name, file, {
    access: 'public',
  });
  return blob.url; // Publicly accessible CDN URL
}
```

### Client Upload (Direct to Blob)
```ts
// app/api/avatar/upload/route.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
    }),
    onUploadCompleted: async ({ blob }) => {
      console.log('Blob upload finished:', blob.url);
    },
  });
  return NextResponse.json(jsonResponse);
}
```

---

## 2. Neon Postgres (Serverless Relational Database)

### Quick Provisioning
```bash
vercel install neon
```
Automatically provisions a serverless PostgreSQL database and populates `POSTGRES_URL` and `DATABASE_URL` in your project environment.

### Usage with `@neondatabase/serverless`
```ts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function getPosts() {
  const posts = await sql`SELECT * FROM posts ORDER BY created_at DESC LIMIT 10`;
  return posts;
}
```

---

## 3. Upstash Redis (KV & Rate Limiting)

### Quick Provisioning
```bash
vercel install upstash
```

### Rate Limiting Example
```bash
npm install @upstash/ratelimit @upstash/redis
```

```ts
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});
```
