import { afterEach, describe, expect, test } from 'bun:test'

import { useKernelStore } from '@store/kernel.store'

const store = useKernelStore

function resetStore() {
  store.setState({
    status: {},
    runningBlock: null,
    ws: null,
  })
}

afterEach(resetStore)

describe('kernel store', () => {
  test('setStatus updates kernel status', () => {
    store.getState().setStatus('nb1', 'ready')
    expect(store.getState().status['nb1']).toBe('ready')

    store.getState().setStatus('nb1', 'running')
    expect(store.getState().status['nb1']).toBe('running')

    store.getState().setStatus('nb1', 'error')
    expect(store.getState().status['nb1']).toBe('error')
  })

  test('multiple notebooks have independent status', () => {
    store.getState().setStatus('nb1', 'ready')
    store.getState().setStatus('nb2', 'running')
    expect(store.getState().status['nb1']).toBe('ready')
    expect(store.getState().status['nb2']).toBe('running')
  })

  test('initial state has no running block', () => {
    expect(store.getState().runningBlock).toBeNull()
    expect(store.getState().ws).toBeNull()
  })
})
