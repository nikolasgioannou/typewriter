import { resolve } from 'path'

const result = await Bun.build({
  entrypoints: [resolve(import.meta.dir, '../src/client/main.tsx')],
  outdir: resolve(import.meta.dir, '../dist'),
  minify: true,
  splitting: true,
  sourcemap: 'none',
  plugins: [(await import('bun-plugin-tailwind')).default],
})

if (!result.success) {
  console.error('Build failed:')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

// Copy static assets
const srcDir = resolve(import.meta.dir, '../src/client')
const distDir = resolve(import.meta.dir, '../dist')

// Copy favicon
await Bun.write(`${distDir}/favicon.svg`, Bun.file(`${srcDir}/favicon.svg`))

// Generate index.html with hashed asset references
const outputs = result.outputs
const jsFile = outputs.find((o) => o.path.endsWith('.js') && o.kind === 'entry-point')
const cssFile = outputs.find((o) => o.path.endsWith('.css'))

const jsName = jsFile ? jsFile.path.split('/').pop() : 'main.js'
const cssName = cssFile ? cssFile.path.split('/').pop() : ''

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Typewriter</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    ${cssName ? `<link rel="stylesheet" href="/${cssName}" />` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${jsName}"></script>
  </body>
</html>`

await Bun.write(`${distDir}/index.html`, html)

console.log(`Built to dist/ (${outputs.length} files)`)
