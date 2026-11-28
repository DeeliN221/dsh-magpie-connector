/**
 * Client-side shapes of the D10 resources. Every field the host may omit is
 * optional here and is simply not rendered when absent — the page never
 * fabricates placeholders or inferred values.
 */
import { t } from './locales.js';
/** Visibility key and settings section of every routing entry (host `ROUTING_OWNER`). */
export const ROUTING_PROVIDER = 'routing';
const str = (value) => typeof value === 'string' && value !== '';
/** Defensive parse of the line-check response: no fabricated fields, unknown kinds dropped. */
export function parseCheck(body) {
    const raw = (body && typeof body === 'object' ? body : {});
    if (!str(raw.kind) || typeof raw.latencyMs !== 'number' || !Number.isFinite(raw.latencyMs))
        return undefined;
    const models = Array.isArray(raw.models)
        ? raw.models.filter((entry) => !!entry && typeof entry === 'object' && str(entry.id)).map(entry => ({ id: entry.id }))
        : undefined;
    return {
        kind: raw.kind, latencyMs: Math.max(0, Math.round(raw.latencyMs)),
        ...(typeof raw.gatewayStatus === 'number' ? { gatewayStatus: raw.gatewayStatus } : {}),
        ...(str(raw.reason) ? { reason: raw.reason } : {}),
        ...(typeof raw.modelCount === 'number' ? { modelCount: raw.modelCount } : {}),
        ...(models ? { models } : {}),
        ...(str(raw.testedAt) ? { testedAt: raw.testedAt } : {}),
    };
}
/** Everything that makes a snapshot stale for one card: identity plus unsaved credential edits. */
export const checkSignature = (draft) => JSON.stringify([draft.id ?? null, draft.baseUrl.trim(), draft.accessMode, draft.apiKey, draft.accessClientId, draft.accessClientSecret]);
/** Cached catalog ids the snapshot is compared against (never the live "current line" catalog). */
export const cacheIds = (groups) => (groups ?? []).flatMap(group => group.models.map(model => model.id));
/**
 * Diff against the cached catalog. Comparing only complete model ids keeps both sides comparable:
 * the cache exposes raw `provider` keys while the check result carries no ownership at all.
 */
export function checkDiff(snapshot, cache) {
    if (!snapshot.models)
        return undefined;
    const have = new Set(snapshot.models.map(model => model.id));
    const known = new Set(cache);
    return { added: [...have].filter(id => !known.has(id)), removed: [...known].filter(id => !have.has(id)) };
}
/** Defensive parse: unknown or malformed entries never reach the renderer. */
export function parseCards(body, httpStatus) {
    const raw = (body && typeof body === 'object' ? body : {});
    const ok = httpStatus >= 200 && httpStatus < 300;
    const known = ['ok', 'forbidden', 'error', 'unconfigured'];
    const status = known.includes(raw.status) ? raw.status
        : httpStatus === 403 ? 'forbidden' : ok ? 'ok' : 'error';
    const cards = Array.isArray(raw.cards) ? raw.cards.filter((c) => !!c && typeof c === 'object' && str(c.provider)) : [];
    return { status, ...(str(raw.error) ? { error: raw.error } : {}), cards };
}
/** Time string from the gateway: a parseable instant renders localized, anything else verbatim. */
export function formatTime(raw) {
    const time = Date.parse(raw);
    return Number.isNaN(time) ? raw : new Date(time).toLocaleString();
}
/**
 * How far a reset credit's expiry still is, as "in N days" / "in N hours" /
 * "expired". Undefined when the gateway string is not an instant, so nothing
 * is invented for it.
 */
export function expiryHint(raw, now = Date.now()) {
    const at = Date.parse(raw);
    if (Number.isNaN(at))
        return undefined;
    const left = at - now;
    if (left <= 0)
        return t('resetExpired');
    const hours = Math.ceil(left / 3_600_000);
    return hours < 24 ? t('resetInHours', { n: hours }) : t('resetInDays', { n: Math.ceil(left / 86_400_000) });
}
/** Window reading, by precedence unlimited > display > used%. Undefined means "show no reading". */
export function windowReading(window) {
    if (window.unlimited === true)
        return t('unlimited');
    if (str(window.display))
        return window.display;
    if (typeof window.used === 'number' && Number.isFinite(window.used))
        return `${Math.round(window.used * 10) / 10}%`;
    return undefined;
}
export const readTime = (card) => card.readAt ?? card.asOf;
export const cardKey = (card) => `${card.provider}\u0000${card.user ?? ''}`;
export const sameTarget = (a, b) => a.provider === b.provider && (a.user ?? undefined) === (b.user ?? undefined);
// ---- using a reset credit ------------------------------------------------
/** The weekly window the reset guard reads; the gateway names Codex windows by their span. */
export const RESET_WEEKLY_WINDOW = '7 days';
/** Same floor the host revalidates against: a reset is wasted on a nearly idle week. */
export const RESET_MIN_WEEKLY_PERCENT = 80;
/**
 * Client-side pre-check for the reset button. It only decides whether the button
 * looks disabled and why — the host revalidates every condition against a fresh
 * card read before it spends anything.
 */
export function resetBlock(card, now = Date.now()) {
    const weekly = card.windows?.find(window => window.name === RESET_WEEKLY_WINDOW);
    if (!weekly || typeof weekly.used !== 'number' || !Number.isFinite(weekly.used))
        return 'refresh';
    if (weekly.used < RESET_MIN_WEEKLY_PERCENT)
        return 'guard';
    const resetsAt = weekly.resetsAt === undefined ? NaN : Date.parse(weekly.resetsAt);
    if (Number.isNaN(resetsAt) || resetsAt <= now)
        return 'refresh';
    if (card.error)
        return 'refresh';
    if (card.resets?.redeemable !== true)
        return 'restart';
    return undefined;
}
/** The account a reset would be spent for; only a named Codex card offers one. */
export const resetAccount = (card) => card.provider === 'codex' && card.resets?.redeemable === true && str(card.user) ? card.user : undefined;
const num = (value) => typeof value === 'number' && Number.isFinite(value);
/** Defensive parse of a prepare response: a ticket is the only required field. */
export function parseResetTicket(body) {
    const raw = (body && typeof body === 'object' ? body : {});
    if (!str(raw.ticket))
        return undefined;
    return {
        ticket: raw.ticket,
        ...(str(raw.expiresAt) ? { expiresAt: raw.expiresAt } : {}),
        ...(num(raw.weeklyUsedPercent) ? { weeklyUsedPercent: raw.weeklyUsedPercent } : {}),
        ...(str(raw.creditExpiresAt) ? { creditExpiresAt: raw.creditExpiresAt } : {}),
    };
}
/** Defensive parse of a consume response; `cards` is adopted only when it is a real list. */
export function parseResetOutcome(body) {
    const raw = (body && typeof body === 'object' ? body : {});
    if (!str(raw.outcome))
        return undefined;
    const cards = Array.isArray(raw.cards) ? raw.cards.filter((card) => !!card && typeof card === 'object' && str(card.provider)) : undefined;
    return {
        outcome: raw.outcome,
        ...(str(raw.code) ? { code: raw.code } : {}),
        ...(num(raw.windows) ? { windows: raw.windows } : {}),
        ...(str(raw.error) ? { error: raw.error } : {}),
        ...(cards ? { cards } : {}),
    };
}
/** Provider groups in page order: catalog groups first, then card-only providers (never dropped). */
export function providerOrder(groups, cards) {
    // Routing groups belong to no vendor: their section always comes first.
    const order = groups.map(g => g.provider).sort((a, b) => Number(b === ROUTING_PROVIDER) - Number(a === ROUTING_PROVIDER));
    for (const card of cards)
        if (!order.includes(card.provider))
            order.push(card.provider);
    return order;
}
