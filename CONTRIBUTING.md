# Contributing to Typewriter

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/nikolasgioannou/typewriter.git
cd typewriter

# Install dependencies
bun install

# Start the dev server
bun dev

# Open in browser
open http://localhost:8888
```

## Scripts

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `bun dev`           | Start the dev server with HMR |
| `bun test`          | Run tests                     |
| `bun run typecheck` | Type check the codebase       |
| `bun run lint`      | Lint the codebase             |
| `bun run format`    | Format with Prettier          |

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). Commit messages are validated by commitlint.

```
feat: add new feature
fix: fix a bug
refactor: refactor code
chore: update tooling
test: add tests
style: formatting changes
perf: performance improvements
```

## Pull Requests

1. Fork the repo and create your branch from `main`.
2. Make your changes.
3. Ensure `bun test`, `bun run typecheck`, and `bun run lint` all pass.
4. Create a pull request.

## Code Style

- TypeScript strict mode, zero errors.
- Prettier formats on save and pre-commit.
- ESLint catches issues on pre-commit.
- Use path aliases (`@server/*`, `@client/*`, `@shared/*`, etc.).

## Architecture

- **`src/server/`** — Bun.serve entry point, tRPC API, kernel execution engine, WebSocket handler
- **`src/client/`** — React UI, Zustand stores, CodeMirror editor, block components
- **`src/types/`** — Shared types used by both server and client
- **`tests/`** — Test files mirroring the src structure
