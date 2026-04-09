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

const listVarsCode =
  'Object.keys(globalThis).filter(k => !__builtinKeys.has(k) && !k.startsWith("__") && k !== "require")'

describe('display block data evaluation', () => {
  const nbId = 'test-display'

  test('declares an array variable and retrieves it via __tw', async () => {
    await collectOutputs(
      nbId,
      'd1',
      "const data = [{ month: 'Jan', sales: 100 }, { month: 'Feb', sales: 150 }]"
    )

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
    const outputs = await collectOutputs(nbId, 'd3', listVarsCode)
    const ret = outputs.find((o) => o.type === 'return')
    expect(ret).toBeDefined()

    const vars = JSON.parse(ret?.text ?? '')
    expect(Array.isArray(vars)).toBe(true)
    expect(vars).toContain('data')
  })

  test('evaluating non-existent variable returns undefined', async () => {
    const outputs = await collectOutputs(nbId, 'd4', '__tw["nonExistentVar"]')
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
    const outputs = await collectOutputs(nbId, 'd7', listVarsCode)
    const ret = outputs.find((o) => o.type === 'return')
    const vars = JSON.parse(ret?.text ?? '')
    expect(vars).toContain('data')
    expect(vars).toContain('config')
  })

  test('removing a declaration from a cell cleans up the variable', async () => {
    const cellId = 'cell-rerun'

    // First run: declare data and data3
    await collectOutputs(
      nbId,
      cellId,
      "const data = [{ month: 'Jan', sales: 100 }]\nconst data3 = [{ month: 'Feb', sales: 200 }]"
    )

    // Verify both exist
    let outputs = await collectOutputs(nbId, 'check1', listVarsCode)
    let vars = JSON.parse(outputs.find((o) => o.type === 'return')?.text ?? '[]')
    expect(vars).toContain('data')
    expect(vars).toContain('data3')

    // Second run: same cell, but data3 is removed
    await collectOutputs(nbId, cellId, "const data = [{ month: 'Jan', sales: 100 }]")

    // data3 should no longer exist
    outputs = await collectOutputs(nbId, 'check2', listVarsCode)
    vars = JSON.parse(outputs.find((o) => o.type === 'return')?.text ?? '[]')
    expect(vars).toContain('data')
    expect(vars).not.toContain('data3')

    // data3 should be undefined
    outputs = await collectOutputs(nbId, 'check3', '__tw["data3"]')
    const ret = outputs.find((o) => o.type === 'return')
    expect(ret).toBeUndefined()
  })

  test('require does not appear in vars list', async () => {
    const outputs = await collectOutputs(nbId, 'check-require', listVarsCode)
    const vars = JSON.parse(outputs.find((o) => o.type === 'return')?.text ?? '[]')
    expect(vars).not.toContain('require')
  })
})
