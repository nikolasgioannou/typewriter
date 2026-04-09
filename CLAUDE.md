# Typewriter

A local TypeScript notebook app — like Jupyter, but for TypeScript. Powered by Bun.

## Tech Stack

- **Runtime**: Bun (not Node.js)
- **Server**: `Bun.serve()` with tRPC + WebSocket
- **Client**: React, Zustand, CodeMirror 6, Recharts, Radix UI, Tailwind v4
- **Build**: `bun-plugin-tailwind` for dev, `Bun.build()` for production

## Commands

- `bun dev` — dev server with HMR (runs `src/server/dev.ts`)
- `bun run build` — build client to `dist/` (runs `scripts/build.ts`)
- `bun start` — production server serving `dist/` (runs `src/server/index.ts`)
- `bun test` — run tests
- `bun run typecheck` — type check
- `bun run lint` — lint
- `bun run format` — format with Prettier
- `bun run release:patch|minor|major` — bump version, tag, push, create release

## Architecture

```
src/
├── server/
│   ├── dev.ts          # Dev entry point (HTML imports + HMR)
│   ├── index.ts        # Production entry point (serves dist/)
│   ├── api/            # tRPC routers (notebooks CRUD)
│   ├── kernel/         # TypeScript execution engine
│   │   ├── manager.ts  # Kernel process lifecycle + queuing
│   │   └── runner.ts   # Child process that eval's TypeScript
│   ├── ws/             # WebSocket handler
│   └── lib/            # Shared server utilities
├── client/
│   ├── main.tsx        # React entry point
│   ├── components/
│   │   ├── ui/         # Design system (Button, Select, IconButton, etc.)
│   │   ├── editor/     # Block editor (Editor, BlockWrapper, SlashMenu)
│   │   │   └── blocks/ # Block components (TextBlock, CodeBlock, etc.)
│   │   └── layout/     # Shell, Sidebar, Topbar
│   ├── hooks/          # React hooks
│   ├── store/          # Zustand stores (notebook, kernel)
│   ├── lib/            # Client utilities (cn, trpc, utils)
│   └── styles/         # Tailwind CSS
├── types/              # Shared types (notebook, ws)
└── skill/              # Agent skill template (SKILL.md)
```

## Conventions

- Use `bun` not `node`, `npm`, or `vite`
- Use `bun add` to install packages, never edit package.json directly
- Path aliases: `@server/*`, `@client/*`, `@shared/*`, `@ui/*`, `@hooks/*`, `@store/*`, `@lib/*`
- Tailwind v4 — CSS-based config, no `tailwind.config.ts`
- Radix UI for all interactive primitives (Select, DropdownMenu, Popover, etc.)
- Lucide React for all icons
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `style:`, `perf:`, `docs:`
- Commit subject only, no body. Under 100 chars.
- All packages via `bun add`, never write deps into package.json

## Key Patterns

- **Two server modes**: `dev.ts` uses Bun HTML imports with HMR. `index.ts` serves pre-built static files from `dist/`.
- **Kernel**: Each notebook gets a persistent `Bun.spawn` child process (`runner.ts`). Code cells are eval'd with variable persistence via `globalThis`. Per-cell variable tracking cleans up removed declarations.
- **WebSocket**: Plain WebSocket for code execution streaming. tRPC for notebook CRUD.
- **Autosave**: Debounced 1s, reads latest store state at save time, checks for changes during save.
- **Notebook files**: `.tw.json` in the user's working directory. Per-notebook `node_modules` in `~/.typewriter/notebooks/<id>/`.
- **Display blocks**: Evaluate variables from the kernel via WebSocket `eval` message. Auto-refresh all display blocks when any code block finishes.
- **Block focus**: Uses `pendingFocusId` pattern — set the ID, React renders, `useEffect` focuses after render via `requestAnimationFrame`.

## Testing

Tests live in `tests/` mirroring `src/` structure. Use `bun:test`.

```ts
import { test, expect } from 'bun:test'

test('example', () => {
  expect(1).toBe(1)
})
```
