import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { appRouter } from '@server/api/router'

let tmpDir: string
let originalCwd: string
let createdId: string

beforeAll(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'typewriter-test-'))
  originalCwd = process.cwd()
  process.chdir(tmpDir)
})

afterAll(async () => {
  process.chdir(originalCwd)
  await rm(tmpDir, { recursive: true })
})

const caller = appRouter.createCaller({})

describe('notebooks.list', () => {
  test('returns empty list when no notebooks exist', async () => {
    const result = await caller.notebooks.list()
    expect(result).toEqual([])
  })
})

describe('notebooks.create', () => {
  test('creates a notebook and returns it', async () => {
    const result = await caller.notebooks.create({ title: 'Test Notebook' })
    createdId = result.id
    expect(result.id).toHaveLength(8)
    expect(result.title).toBe('Test Notebook')
    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0]?.type).toBe('code')

    const file = Bun.file(join(tmpDir, `${createdId}.tw.json`))
    expect(await file.exists()).toBe(true)
  })
})

describe('notebooks.byId', () => {
  test('retrieves a created notebook', async () => {
    const result = await caller.notebooks.byId({ id: createdId })
    expect(result.title).toBe('Test Notebook')
  })

  test('throws on missing notebook', async () => {
    expect(caller.notebooks.byId({ id: 'nonexistent' })).rejects.toThrow()
  })
})

describe('notebooks.save', () => {
  test('saves updated notebook', async () => {
    const notebook = await caller.notebooks.byId({ id: createdId })
    const updated = {
      ...notebook,
      title: 'Updated Title',
      blocks: [
        ...notebook.blocks,
        { id: crypto.randomUUID(), type: 'text' as const, content: 'hello' },
      ],
    }

    const result = await caller.notebooks.save({ id: createdId, notebook: updated })
    expect(result.title).toBe('Updated Title')
    expect(result.blocks).toHaveLength(2)
  })
})

describe('notebooks.list after create', () => {
  test('returns created notebooks sorted by updated', async () => {
    await caller.notebooks.create({ title: 'Second Notebook' })
    const result = await caller.notebooks.list()
    expect(result).toHaveLength(2)
    const titles = result.map((n) => n.title)
    expect(titles).toContain('Second Notebook')
    expect(titles).toContain('Updated Title')
  })
})
