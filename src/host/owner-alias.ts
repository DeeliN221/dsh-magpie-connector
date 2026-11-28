/**
 * Owners that name the same vendor share one route and one group in DSH's model
 * picker. Key = gateway `owned_by` (lower-cased), value = the owner shown.
 * Display only: the gateway's providers, keys and routing stay as they are.
 *
 * Recovered from the 0.6.12 install (`lib/host/owner-alias.js`) and re-applied on
 * top of 0.7.5, which dropped the module while the catalog and visibility keys
 * were reworked. Every consumer below keeps the 0.6.12 behaviour: the same two
 * aliases collapse onto one route, one picker group and one saved visibility key.
 */
export const OWNER_ALIAS: Readonly<Record<string, string>> = Object.freeze({
  'deepseek-personal': 'deepseek',
  'openai-hua': 'openai',
})

/** The owner an `owned_by` (or an already canonical owner) is shown under. */
export const canonicalOwner = (key: string): string => Object.hasOwn(OWNER_ALIAS, key) ? OWNER_ALIAS[key]! : key

/** Rewrite saved visibility keys (owner -> model ids) onto canonical owners, merging collisions. */
export function canonicalVisibility(saved: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const [owner, ids] of Object.entries(saved)) {
    const key = canonicalOwner(owner)
    out[key] = [...new Set([...(out[key] ?? []), ...(Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : [])])]
  }
  return out
}
