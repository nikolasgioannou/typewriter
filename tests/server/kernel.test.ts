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

describe('kernel', () => {
  const nbId = 'test-kernel'

  test('captures stdout', async () => {
    const outputs = await collectOutputs(nbId, 'b1', 'console.log("hello")')
    const stdout = outputs.find((o) => o.type === 'stdout')
    expect(stdout?.text).toBe('hello')
    expect(outputs.some((o) => o.type === 'done')).toBe(true)
  })

  test('captures return value', async () => {
    const outputs = await collectOutputs(nbId, 'b2', '1 + 2')
    const ret = outputs.find((o) => o.type === 'return')
    expect(ret?.text).toBe('3')
  })

  test('persists variables across cells', async () => {
    await collectOutputs(nbId, 'b3', 'var x = 42')
    const outputs = await collectOutputs(nbId, 'b4', 'x')
    const ret = outputs.find((o) => o.type === 'return')
    expect(ret?.text).toBe('42')
  })

  test('handles errors without crashing', async () => {
    const outputs = await collectOutputs(nbId, 'b5', 'throw new Error("test error")')
    const err = outputs.find((o) => o.type === 'error')
    expect(err?.text).toContain('test error')

    const outputs2 = await collectOutputs(nbId, 'b6', '1 + 1')
    const ret = outputs2.find((o) => o.type === 'return')
    expect(ret?.text).toBe('2')
  })

  test('supports top-level await', async () => {
    const outputs = await collectOutputs(
      nbId,
      'b7',
      'const result = await Promise.resolve("async")\nresult'
    )
    const ret = outputs.find((o) => o.type === 'return')
    expect(ret?.text).toBe('async')
  })

  test('captures stderr', async () => {
    const outputs = await collectOutputs(nbId, 'b8', 'console.error("warning")')
    const stderr = outputs.find((o) => o.type === 'stderr')
    expect(stderr?.text).toBe('warning')
  })
})
