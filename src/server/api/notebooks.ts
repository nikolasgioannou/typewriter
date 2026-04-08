import type { Block, Notebook } from '@shared/notebook'
import { z } from 'zod'

import { publicProcedure, router } from './trpc'

const OutputSchema = z.object({
  type: z.enum(['stdout', 'stderr', 'return', 'error']),
  text: z.string(),
  timestamp: z.number(),
})

const BlockSchema: z.ZodType<Block> = z.object({
  id: z.string(),
  type: z.enum(['text', 'heading1', 'heading2', 'heading3', 'code', 'shell', 'display', 'divider']),
  content: z.string(),
  outputs: z.array(OutputSchema).optional(),
  executionCount: z.number().optional(),
  durationMs: z.number().optional(),
  displayConfig: z
    .object({
      variable: z.string(),
      chartType: z.enum(['table', 'line', 'bar', 'area', 'scatter', 'pie']),
      xKey: z.string().optional(),
      yKey: z.string().optional(),
      title: z.string().optional(),
    })
    .optional(),
})

const NotebookSchema: z.ZodType<Notebook> = z.object({
  id: z.string(),
  title: z.string(),
  created: z.number(),
  updated: z.number(),
  blocks: z.array(BlockSchema),
})

function notebookPath(id: string): string {
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error('Invalid notebook ID')
  }
  return `${process.cwd()}/${id}.tw.json`
}

export const notebooksRouter = router({
  list: publicProcedure.query(async () => {
    const glob = new Bun.Glob('*.tw.json')
    const notebooks: Array<{ id: string; title: string; updated: number }> = []

    for await (const path of glob.scan(process.cwd())) {
      const file = Bun.file(path)
      const data = (await file.json()) as Notebook
      notebooks.push({ id: data.id, title: data.title, updated: data.updated })
    }

    return notebooks.sort((a, b) => b.updated - a.updated)
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const file = Bun.file(notebookPath(input.id))
    if (!(await file.exists())) {
      throw new Error(`Notebook "${input.id}" not found`)
    }
    return (await file.json()) as Notebook
  }),

  create: publicProcedure.input(z.object({ title: z.string() })).mutation(async ({ input }) => {
    const id = crypto.randomUUID().slice(0, 8)
    const notebook: Notebook = {
      id,
      title: input.title,
      created: Date.now(),
      updated: Date.now(),
      blocks: [],
    }

    await Bun.write(notebookPath(id), JSON.stringify(notebook, null, 2))
    return notebook
  }),

  save: publicProcedure
    .input(z.object({ id: z.string(), notebook: NotebookSchema }))
    .mutation(async ({ input }) => {
      const updated = { ...input.notebook, updated: Date.now() }
      await Bun.write(notebookPath(input.id), JSON.stringify(updated, null, 2))
      return updated
    }),

  duplicate: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const file = Bun.file(notebookPath(input.id))
    if (!(await file.exists())) {
      throw new Error(`Notebook "${input.id}" not found`)
    }
    const source = (await file.json()) as Notebook
    const newId = crypto.randomUUID().slice(0, 8)
    const notebook: Notebook = {
      ...source,
      id: newId,
      title: source.title,
      created: Date.now(),
      updated: Date.now(),
    }
    await Bun.write(notebookPath(newId), JSON.stringify(notebook, null, 2))
    return notebook
  }),

  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const { unlink } = await import('node:fs/promises')
    const { cleanupNotebookEnv } = await import('@server/lib/notebook-env')
    const path = notebookPath(input.id)
    await unlink(path)
    await cleanupNotebookEnv(input.id)
    return { id: input.id }
  }),
})
