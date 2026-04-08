import { afterAll, describe, expect, test } from 'bun:test'

import { type KernelOutput, runCode, shutdown } from '@server/kernel/manager'

afterAll(() => {
  shutdown()
})

async function collectOutputs(
  notebookId: string,
  blockId: string,
  code: string
): Promise<KernelOutput[]> {
  const outputs: KernelOutput[] = []
  for await (const output of runCode(notebookId, blockId, code)) {
    outputs.push(output)
  }
  return outputs
}

describe('display block data evaluation', () => {
  const nbId = 'test-display'

  test('declares an array variable and retrieves it via __tw', async () => {
    await collectOutputs(
      nbId,
      'd1',
      "const data = [{ month: 'Jan', sales: 100 }, { month: 'Feb', sales: 150 }]"
    )

    // Access via __tw (how the eval endpoint works)
    const outputs = await collectOutputs(nbId, 'd2', '__tw["data"]')
    const ret = outputs.find((o) => o.type === 'return')
    expect(ret).toBeDefined()

    const parsed = JSON.parse(ret?.text ?? '')
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].month).toBe('Jan')
    expect(parsed[0].sales).toBe(100)
  })

  test('user vars tracking works', async () => {
    const outputs = await collectOutputs(nbId, 'd3', '[...__tw.__userVars]')
    const ret = outputs.find((o) => o.type === 'return')
    expect(ret).toBeDefined()

    const vars = JSON.parse(ret?.text ?? '')
    expect(Array.isArray(vars)).toBe(true)
    expect(vars).toContain('data')
  })

  test('evaluating non-existent variable returns undefined', async () => {
    const outputs = await collectOutputs(nbId, 'd4', '__tw["nonExistentVar"]')
    // Should return done with no return value (undefined)
    const ret = outputs.find((o) => o.type === 'return')
    expect(ret).toBeUndefined()
    const done = outputs.find((o) => o.type === 'done')
    expect(done).toBeDefined()
  })

  test('evaluating an object variable works', async () => {
    await collectOutputs(nbId, 'd5', "const config = { name: 'test', count: 42 }")
    const outputs = await collectOutputs(nbId, 'd6', '__tw["config"]')
    const ret = outputs.find((o) => o.type === 'return')
    expect(ret).toBeDefined()

    const parsed = JSON.parse(ret?.text ?? '')
    expect(parsed.name).toBe('test')
    expect(parsed.count).toBe(42)
  })

  test('user vars includes all declared variables', async () => {
    const outputs = await collectOutputs(nbId, 'd7', '[...__tw.__userVars]')
    const ret = outputs.find((o) => o.type === 'return')
    const vars = JSON.parse(ret?.text ?? '')
    expect(vars).toContain('data')
    expect(vars).toContain('config')
  })
})
