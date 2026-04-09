# Typewriter

A local TypeScript notebook app — like Jupyter, but for TypeScript. Powered by [Bun](https://bun.sh).

Write and execute TypeScript code cells, install npm packages, run shell commands, and visualize data — all in a block-based editor that runs natively on your machine.

## Features

- **TypeScript code cells** — execute TypeScript natively via Bun. No compilation step. Variables persist across cells. Supports `import` and `require`.
- **Shell blocks** — run terminal commands like `bun add lodash` directly in the notebook.
- **Data display blocks** — visualize variables as tables, bar charts, line charts, area charts, scatter plots, and pie charts. Powered by Recharts.
- **Per-notebook environments** — each notebook gets its own `node_modules`. Install packages in a shell block, import them in code cells.
- **Block-based editor** — text, headings, code, shell, display, and divider blocks. Slash commands (`/`) to insert blocks. Drag to reorder. Lasso select multiple blocks.
- **Auto-save** — notebooks save automatically as `.tw.json` files in your working directory.
- **Dark mode** — follows your system preference.
- **Fast** — kernel output is batched for instant rendering. 10,000 console.logs render in milliseconds.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/nikolasgioannou/typewriter/main/scripts/install.sh | bash
```

Requires [Bun](https://bun.sh). The install script will install it for you if it's not already available.

## Usage

```bash
# Start Typewriter in the current directory
typewriter

# Check version
typewriter --version

# Update to latest
typewriter update

# Uninstall
typewriter uninstall
```

Typewriter starts a local server on port 8888 (auto-increments if taken).

## Agent Skills

Let AI coding assistants create `.tw.json` notebooks for you. Supports [Claude Code](https://claude.ai/code) and [Cursor](https://cursor.com).

```bash
# Install skill for all supported platforms
typewriter skill

# Install for a specific platform
typewriter skill claude
typewriter skill cursor
```

Once installed, ask your AI assistant to "create a TypeScript notebook that analyzes this data" and it will generate a `.tw.json` file you can open with Typewriter.

Notebooks are saved as `.tw.json` files in the directory where you run `typewriter`.

## Development

```bash
git clone https://github.com/nikolasgioannou/typewriter.git
cd typewriter
bun install
bun dev
```

| Command             | Description                 |
| ------------------- | --------------------------- |
| `bun dev`           | Start dev server with HMR   |
| `bun run build`     | Build client for production |
| `bun start`         | Start production server     |
| `bun test`          | Run tests                   |
| `bun run typecheck` | Type check                  |
| `bun run lint`      | Lint                        |
| `bun run format`    | Format with Prettier        |

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

[MIT](LICENSE)
