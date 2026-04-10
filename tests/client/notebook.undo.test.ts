import { afterEach, describe, expect, test } from 'bun:test'

import { useNotebookStore } from '@store/notebook.store'

const store = useNotebookStore

function resetStore() {
  store.setState({
    activeNotebookId: null,
    notebook: null,
    isDirty: false,
    history: [],
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

  test('undo reverts insertBlocksAfter', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().insertBlocksAfter('b1', [{ id: 'new1', type: 'text', content: 'inserted' }])
    expect(store.getState().notebook?.blocks).toHaveLength(4)

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

  test('undo reverts reorder', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().reorderBlocks(0, 2)
    expect(store.getState().notebook?.blocks[0]?.id).toBe('b2')

    store.getState().undo()
    expect(store.getState().notebook?.blocks[0]?.id).toBe('b1')
  })

  test('history resets when notebook changes', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().removeBlock('b1')
    expect(store.getState().history).toHaveLength(1)

    store.getState().setNotebook(sampleNotebook)
    expect(store.getState().history).toHaveLength(0)
  })
})
