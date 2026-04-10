import { afterEach, describe, expect, test } from 'bun:test'

import { useNotebookStore } from '@store/notebook.store'

const store = useNotebookStore

function resetStore() {
  store.setState({
    activeNotebookId: null,
    notebook: null,
    isDirty: false,
    history: [],
    blockClipboard: [],
  })
}

afterEach(resetStore)

const sampleNotebook = {
  id: 'test',
  title: 'Test',
  created: Date.now(),
  updated: Date.now(),
  blocks: [
    { id: 'b1', type: 'code' as const, content: 'console.log(1)' },
    { id: 'b2', type: 'text' as const, content: 'hello' },
    { id: 'b3', type: 'code' as const, content: 'console.log(2)' },
  ],
}

describe('undo', () => {
  test('undo reverts block deletion', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().removeBlock('b2')
    expect(store.getState().notebook?.blocks).toHaveLength(2)

    store.getState().undo()
    expect(store.getState().notebook?.blocks).toHaveLength(3)
    expect(store.getState().notebook?.blocks[1]?.id).toBe('b2')
  })

  test('undo reverts block addition', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().addBlock('b1', 'text')
    expect(store.getState().notebook?.blocks).toHaveLength(4)

    store.getState().undo()
    expect(store.getState().notebook?.blocks).toHaveLength(3)
  })

  test('undo reverts bulk deletion', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().removeBlocks(['b1', 'b3'])
    expect(store.getState().notebook?.blocks).toHaveLength(1)

    store.getState().undo()
    expect(store.getState().notebook?.blocks).toHaveLength(3)
  })

  test('multiple undos work in sequence', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().removeBlock('b1')
    store.getState().removeBlock('b2')
    expect(store.getState().notebook?.blocks).toHaveLength(1)

    store.getState().undo()
    expect(store.getState().notebook?.blocks).toHaveLength(2)

    store.getState().undo()
    expect(store.getState().notebook?.blocks).toHaveLength(3)
  })

  test('undo does nothing when history is empty', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().undo()
    expect(store.getState().notebook?.blocks).toHaveLength(3)
  })
})

describe('copy/paste blocks', () => {
  test('copy and paste duplicates blocks', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().copyBlocks(['b1', 'b2'])
    expect(store.getState().blockClipboard).toHaveLength(2)

    const newIds = store.getState().pasteBlocks('b3')
    expect(newIds).toHaveLength(2)
    expect(store.getState().notebook?.blocks).toHaveLength(5)

    // Pasted blocks have new IDs
    expect(newIds[0]).not.toBe('b1')
    expect(newIds[1]).not.toBe('b2')

    // Pasted blocks have same content
    const blocks = store.getState().notebook?.blocks ?? []
    const pasted1 = blocks.find((b) => b.id === newIds[0])
    expect(pasted1?.content).toBe('console.log(1)')
  })

  test('cut removes blocks and paste adds them back', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().cutBlocks(['b2'])
    expect(store.getState().notebook?.blocks).toHaveLength(2)
    expect(store.getState().blockClipboard).toHaveLength(1)

    const newIds = store.getState().pasteBlocks('b1')
    expect(newIds).toHaveLength(1)
    expect(store.getState().notebook?.blocks).toHaveLength(3)
  })

  test('paste with no clipboard does nothing', () => {
    store.getState().setNotebook(sampleNotebook)
    const newIds = store.getState().pasteBlocks('b1')
    expect(newIds).toHaveLength(0)
    expect(store.getState().notebook?.blocks).toHaveLength(3)
  })

  test('undo reverts cut', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().cutBlocks(['b1', 'b2'])
    expect(store.getState().notebook?.blocks).toHaveLength(1)

    store.getState().undo()
    expect(store.getState().notebook?.blocks).toHaveLength(3)
  })
})
