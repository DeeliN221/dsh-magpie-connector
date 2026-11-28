import type { SidebarWindowKind } from '../shared/sidebar-window.js';
export interface CardWindow {
    name?: string;
    used?: number;
    resetsAt?: string;
    unlimited?: boolean;
    display?: string;
}
/** One Codex-style reset credit: when it runs out and, counted by window, which window's. */
export interface CardReset {
    until?: string;
    window?: string;
}
/**
 * A card's reset credits as the gateway tells them: the count, the soonest
 * expiry, per-window counts for plans that hand out one kind each, and every
 * credit still held (`each`, soonest first). `redeemable` is the host's word
 * that this card could spend one from here (Codex, a named account, and at
 * least one credit the host knows the id of).
 */
export interface CardResets {
    count?: number;
    until?: string;
    byWindow?: boolean;
    fiveHour?: number;
    weekly?: number;
    each?: CardReset[];
    redeemable?: boolean;
}
export interface Card {
    provider: string;
    name?: string;
    icon?: string;
    user?: string;
    plan?: string;
    until?: string;
    renew?: string | boolean;
    balance?: string | number;
    readAt?: string;
    asOf?: string;
    error?: string;
    windows?: CardWindow[];
    resets?: CardResets;
}
export type CardsStatus = 'ok' | 'forbidden' | 'error' | 'unconfigured';
export interface CardsView {
    status: CardsStatus;
    error?: string;
    cards: Card[];
}
export interface ModelRow {
    id: string;
    name?: string;
    efforts?: string[];
    visible?: boolean; /** Set by the host on Magpie routing entries only. */
    routingKind?: 'auto' | 'custom';
}
/** Visibility key and settings section of every routing entry (host `ROUTING_OWNER`). */
export declare const ROUTING_PROVIDER = "routing";
export interface ModelGroup {
    provider: string;
    models: ModelRow[];
}
export type SyncErrorKind = 'unauthorized' | 'forbidden' | 'http' | 'unreachable' | 'settings' | 'registration';
export interface LineView {
    id?: string;
    baseUrl?: string;
    accessMode?: 'direct' | 'cloudflare';
    complete?: boolean;
    key?: {
        configured?: boolean;
        writable?: boolean;
    };
    access?: {
        clientId?: {
            configured?: boolean;
            writable?: boolean;
        };
        clientSecret?: {
            configured?: boolean;
            writable?: boolean;
        };
    };
    refs?: {
        key?: string;
        accessClientId?: string;
        accessClientSecret?: string;
    };
}
export interface SettingsView {
    lines?: LineView[];
    activeLineId?: string | null;
    pending?: {
        lineId?: string;
        field?: string;
    }[];
    retainedCredentials?: {
        lineId?: string;
        field?: string;
    }[];
    access?: {
        clientId?: {
            configured?: boolean;
            writable?: boolean;
        };
        clientSecret?: {
            configured?: boolean;
            writable?: boolean;
        };
    };
    lastSyncAt?: string;
    lastSyncError?: string;
    lastSyncErrorKind?: SyncErrorKind;
    groups?: ModelGroup[];
    visibleModels?: Record<string, string[]>;
    defaultEfforts?: Record<string, string>;
    /** Initial route registration failed (design D6): the host must be restarted to recover. */
    routeRegistrationError?: {
        code: string;
        route?: string;
    };
    /** knownOwners was invalid at load and reset to empty (spec 归属 route 持久). */
    knownOwnersReset?: boolean;
    /** Host-persisted sidebar usage card preference (absent = false). */
    sidebarUsage?: boolean;
    /** Sidebar auto-refresh interval in minutes (absent = 5, 0 = off). */
    sidebarRefreshMinutes?: number;
    /** Gateway windows the sidebar card lists (absent = weekly). */
    sidebarWindows?: SidebarWindowKind[];
    /** The owner cap (32) rejected new owners; `rejectedOwners` lists them. */
    ownerLimitReached?: boolean;
    rejectedOwners?: string[];
}
/** One read-only line check result, exactly as the host classified it. */
export interface CheckSnapshot {
    kind: string;
    gatewayStatus?: number;
    reason?: string;
    latencyMs: number;
    modelCount?: number;
    models?: {
        id: string;
    }[];
    testedAt: string;
}
/** Defensive parse of the line-check response: no fabricated fields, unknown kinds dropped. */
export declare function parseCheck(body: unknown): CheckSnapshot | undefined;
/** Everything that makes a snapshot stale for one card: identity plus unsaved credential edits. */
export declare const checkSignature: (draft: {
    id?: string | undefined;
    baseUrl: string;
    accessMode: string;
    apiKey: string;
    accessClientId: string;
    accessClientSecret: string;
}) => string;
/** Cached catalog ids the snapshot is compared against (never the live "current line" catalog). */
export declare const cacheIds: (groups: ModelGroup[] | undefined) => string[];
/**
 * Diff against the cached catalog. Comparing only complete model ids keeps both sides comparable:
 * the cache exposes raw `provider` keys while the check result carries no ownership at all.
 */
export declare function checkDiff(snapshot: CheckSnapshot, cache: string[]): {
    added: string[];
    removed: string[];
} | undefined;
/** Defensive parse: unknown or malformed entries never reach the renderer. */
export declare function parseCards(body: unknown, httpStatus: number): CardsView;
/** Time string from the gateway: a parseable instant renders localized, anything else verbatim. */
export declare function formatTime(raw: string): string;
/**
 * How far a reset credit's expiry still is, as "in N days" / "in N hours" /
 * "expired". Undefined when the gateway string is not an instant, so nothing
 * is invented for it.
 */
export declare function expiryHint(raw: string, now?: number): string | undefined;
/** Window reading, by precedence unlimited > display > used%. Undefined means "show no reading". */
export declare function windowReading(window: CardWindow): string | undefined;
export declare const readTime: (card: Card) => string | undefined;
export declare const cardKey: (card: Pick<Card, "provider" | "user">) => string;
export declare const sameTarget: (a: Card, b: Pick<Card, "provider" | "user">) => boolean;
/** The weekly window the reset guard reads; the gateway names Codex windows by their span. */
export declare const RESET_WEEKLY_WINDOW = "7 days";
/** Same floor the host revalidates against: a reset is wasted on a nearly idle week. */
export declare const RESET_MIN_WEEKLY_PERCENT = 80;
/** Why the "use" button is not actionable right now, as a copy key. */
export type ResetBlock = 'guard' | 'refresh' | 'restart';
/**
 * Client-side pre-check for the reset button. It only decides whether the button
 * looks disabled and why — the host revalidates every condition against a fresh
 * card read before it spends anything.
 */
export declare function resetBlock(card: Card, now?: number): ResetBlock | undefined;
/** The account a reset would be spent for; only a named Codex card offers one. */
export declare const resetAccount: (card: Card) => string | undefined;
/** Prepared confirmation, as the host answered it. */
export interface ResetTicket {
    ticket: string;
    expiresAt?: string;
    weeklyUsedPercent?: number;
    creditExpiresAt?: string;
}
/** What spending the credit did, as the host classified it. */
export interface ResetOutcome {
    outcome: string;
    code?: string;
    windows?: number;
    error?: string;
    cards?: Card[];
}
/** Defensive parse of a prepare response: a ticket is the only required field. */
export declare function parseResetTicket(body: unknown): ResetTicket | undefined;
/** Defensive parse of a consume response; `cards` is adopted only when it is a real list. */
export declare function parseResetOutcome(body: unknown): ResetOutcome | undefined;
/** Provider groups in page order: catalog groups first, then card-only providers (never dropped). */
export declare function providerOrder(groups: ModelGroup[], cards: Card[]): string[];
