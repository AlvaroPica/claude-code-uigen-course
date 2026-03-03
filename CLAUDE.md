# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all tests (Vitest)
npm run setup        # Install deps + Prisma generate + migrate
npm run db:reset     # Reset the database
```

Run a single test file: `npx vitest run src/path/to/file.test.ts`

## Environment

Requires a `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-...  # Optional; falls back to MockLanguageModel
JWT_SECRET=...                 # For JWT signing (defaults to dev key)
```

The app runs without an API key — it uses a `MockLanguageModel` that returns static code for development.

## Architecture

UIGen is a Next.js 15 App Router application where users describe React components in natural language and Claude AI generates them with live preview.

### Core Data Flow

```
Chat Input → useChat (Vercel AI SDK) → POST /api/chat
  → Claude (claude-haiku-4-5) with tool calls
  → str_replace_editor / file_manager tools
  → FileSystemContext updates in-memory VFS
  → PreviewFrame transpiles JSX via @babel/standalone
  → Live iframe preview
```

### Key Architectural Concepts

**Virtual File System (`src/lib/file-system.ts`):** All file operations (create, update, delete, rename, replace-in-file) are in-memory — nothing is written to disk. The VFS serializes to JSON for persistence. The AI interacts with it exclusively via tool calls.

**Tool-Use Pattern:** Claude does not return plain text. It calls `str_replace_editor` (create/modify files) and `file_manager` (rename/delete) tools. The API route in `src/app/api/chat/route.ts` processes these and mutates the VFS.

**AI Provider (`src/lib/provider.ts`):** Wraps `@ai-sdk/anthropic`. If `ANTHROPIC_API_KEY` is missing, returns a `MockLanguageModel`. Model is `claude-haiku-4-5` with up to 40 tool-use steps per request.

**FileSystemContext (`src/lib/contexts/file-system-context.tsx`):** Central React state for the VFS. Processes AI tool calls, manages file selection, and fires a `refreshTrigger` counter to force re-renders in the preview.

**ChatContext (`src/lib/contexts/chat-context.tsx`):** Wraps Vercel AI SDK's `useChat`. Anonymous work is tracked in `localStorage`; authenticated users get DB persistence.

**Sandbox Preview (`src/components/preview/`):** Generated code runs in a sandboxed iframe. JSX is transpiled client-side with `@babel/standalone`. An import map routes library imports (`react`, `react-dom`, etc.) to `esm.sh` CDN URLs.

**Authentication (`src/lib/auth.ts`):** JWT sessions via JOSE, stored in HttpOnly cookies (7-day expiration). `src/middleware.ts` protects routes. Passwords hashed with bcrypt. Server actions in `src/actions/` handle sign-up/sign-in/sign-out.

**Database:** Prisma + SQLite. Schema in `prisma/schema.prisma` has two models: `User` and `Project`. Projects store messages and filesystem state as JSON blobs.

### Route Structure

- `/` — Home page; redirects authenticated users to their project
- `/[projectId]` — Protected project page (authenticated users only)
- `/api/chat` — Streaming chat endpoint (Vercel AI SDK `streamText`)

### UI Layout

`src/app/main-content.tsx` renders a three-panel resizable layout: Chat (left) | Preview/Code Editor (center) | optional File Tree (right). Uses `react-resizable-panels`.

### Path Alias

`@/*` maps to `./src/*`.

## Conventions

- Use comments sparingly — only comment complex/non-obvious code
- Reference `prisma/schema.prisma` when working with DB-related code
