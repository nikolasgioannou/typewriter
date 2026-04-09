import { afterEach, describe, expect, test } from 'bun:test'

import { useNotebookStore } from '@store/notebook.store'

const store = useNotebookStore

function resetStore() {
  store.setState({
    activeNotebookId: null,
    notebook: null,
    isDirty: false,
  })
}

afterEach(resetStore)

const sampleNotebook = {
  id: 'test',
  title: 'Test Notebook',
  created: Date.now(),
  updated: Date.now(),
  blocks: [
    { id: 'b1', type: 'code' as const, content: 'console.log("hi")' },
    { id: 'b2', type: 'text' as const, content: 'hello' },
  ],
}

describe('notebook store', () => {
  test('setNotebook populates state', () => {
    store.getState().setNotebook(sampleNotebook)
    expect(store.getState().notebook?.id).toBe('test')
    expect(store.getState().isDirty).toBe(false)
  })

  test('updateBlock marks dirty', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().updateBlock('b1', { content: 'new code' })
    expect(store.getState().notebook?.blocks[0]?.content).toBe('new code')
    expect(store.getState().isDirty).toBe(true)
  })

  test('addBlock inserts after target', () => {
    store.getState().setNotebook(sampleNotebook)
    const newId = store.getState().addBlock('b1', 'code')
    expect(store.getState().notebook?.blocks).toHaveLength(3)
    expect(store.getState().notebook?.blocks[1]?.id).toBe(newId)
    expect(store.getState().isDirty).toBe(true)
  })

  test('removeBlock removes but keeps at least one', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().removeBlock('b1')
    expect(store.getState().notebook?.blocks).toHaveLength(1)
    expect(store.getState().notebook?.blocks[0]?.id).toBe('b2')

    // Can remove last block — notebook becomes empty
    store.getState().removeBlock('b2')
    expect(store.getState().notebook?.blocks).toHaveLength(0)
  })

  test('reorderBlocks swaps positions', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().reorderBlocks(0, 1)
    expect(store.getState().notebook?.blocks[0]?.id).toBe('b2')
    expect(store.getState().notebook?.blocks[1]?.id).toBe('b1')
  })

  test('updateTitle marks dirty', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().updateTitle('New Title')
    expect(store.getState().notebook?.title).toBe('New Title')
    expect(store.getState().isDirty).toBe(true)
  })

  test('isDirty resets when notebook is set', () => {
    store.getState().setNotebook(sampleNotebook)
    store.getState().updateTitle('trigger dirty')
    expect(store.getState().isDirty).toBe(true)

    store.getState().setNotebook(sampleNotebook)
    expect(store.getState().isDirty).toBe(false)
  })
})
