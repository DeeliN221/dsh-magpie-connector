import { expect, it, vi } from 'vitest'
import { mapCatalog, ownerKey } from '../src/host/catalog.js'
import { canonicalOwner, canonicalVisibility } from '../src/host/owner-alias.js'
import { MagpieRuntime } from '../src/host/runtime.js'
import { SettingsStore, validateKnownOwners } from '../src/host/settings.js'

it('alias owners collapse onto one route and one picker group', () => {
  const models = mapCatalog({ data: [
    { id: 'deepseek-personal/deepseek-v4-pro', owned_by: 'deepseek-personal' },
    { id: 'deepseek/deepseek-v4-flash', owned_by: 'deepseek' },
    { id: 'openai-hua/gpt-6', owned_by: 'openai-hua' },
  ] })
  expect(models.map(m => m.provider)).toEqual(['deepseek', 'deepseek', 'openai'])
  expect(models.map(m => m.owner)).toEqual(['deepseek', 'deepseek', 'openai'])
  expect([...new Set(models.map(m => m.provider))]).toEqual(['deepseek', 'openai'])
})

it('an unaliased owner is left alone, and an untrusted owner still reads as `other`', () => {
  expect(ownerKey('deepseek-personal')).toBe('deepseek')
  expect(ownerKey('OpenAI-Hua')).toBe('openai')
  expect(ownerKey('codex')).toBe('codex')
  expect(canonicalOwner('codex')).toBe('codex')
})

it('saved visibility keys and known owners are rewritten onto the canonical owner', () => {
  expect(canonicalVisibility({ 'deepseek-personal': ['a', 'b'], deepseek: ['b'], openai: [] })).toEqual({ deepseek: ['a', 'b'], openai: [] })
  expect(validateKnownOwners(['deepseek-personal', 'deepseek', 'openai-hua'])).toEqual(['deepseek', 'openai'])
})

it('a runtime started from settings written before the alias folds them', () => {
  const store = new SettingsStore()
  store.value.visibleModels = { 'deepseek-personal': ['deepseek-personal/deepseek-v4-pro'] }
  new MagpieRuntime({ describe: async () => ({ configured: false, writable: true }), resolve: async () => undefined, set: vi.fn(), unset: vi.fn() } as never, store)
  expect(store.value.visibleModels).toEqual({ deepseek: ['deepseek-personal/deepseek-v4-pro'] })
})
