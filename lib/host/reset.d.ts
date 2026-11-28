import type { MagpieRuntime } from './runtime.js';
import type { Card } from '../client/view-model.js';
import type { CardsController, HostCredit } from './cards.js';
/** The weekly window the guard reads; the gateway names Codex windows by their span. */
export declare const RESET_WEEKLY_WINDOW = "7 days";
/** Same floor as the subscriptions plugin: a reset is wasted on a nearly idle week. */
export declare const RESET_MIN_WEEKLY_PERCENT = 80;
/** How long a prepared confirmation stays usable. */
export declare const RESET_TICKET_TTL_MS = 60000;
/** Whole gateway budget: the gateway itself may spend 20s and then re-read for 15s. */
export declare const RESET_TIMEOUT_MS = 45000;
/** Why a card cannot spend a reset right now. */
export type ResetRefusal = 'no-card' | 'error' | 'no-weekly' | 'below-min' | 'window-over' | 'no-credit';
export type ResetPrep = {
    ok: true;
    weeklyUsedPercent: number;
    credit: HostCredit;
} | {
    ok: false;
    reason: ResetRefusal;
};
/** A decided gateway answer, in the terms the page speaks. */
export type ResetOutcome = 'reset' | 'kept' | 'no-credit' | 'already' | 'unknown';
/** Credits that can still be spent, soonest first; one that never runs out goes last. */
export declare function usableCredits(credits: readonly HostCredit[], now: number): HostCredit[];
/** The weekly window of a Codex card, if the gateway reported one. */
export declare const weeklyWindow: (card: Card | undefined) => import("../client/view-model.js").CardWindow | undefined;
/**
 * Is this card allowed to spend one of its credits, and which one? Pure: the
 * caller supplies the freshly read card and the credits the host lifted off it.
 */
export declare function resetPrep(card: Card | undefined, credits: readonly HostCredit[], now: number): ResetPrep;
/** Map the gateway's `code` to the page's outcome; an unrecognized code is kept verbatim. */
export declare function resetOutcomeOf(code: string): ResetOutcome;
export interface ResetOptions {
    now?: () => number;
    /** Deterministic ticket seam for tests. */
    ticketId?: () => string;
    timeoutMs?: number;
}
/**
 * Prepare/consume for one reset. State is process-wide (one ticket, one
 * operation, one lock per account) and is intentionally not persisted: a lock is
 * a warning to check Magpie first, and the gateway refuses a concurrent spend on
 * the same account as its own second line of defence.
 */
export declare class ResetController {
    private readonly runtime;
    private readonly cards;
    private ticket;
    private busy;
    private readonly uncertain;
    private readonly now;
    private readonly ticketId;
    private readonly timeoutMs;
    constructor(runtime: MagpieRuntime, cards: CardsController, options?: ResetOptions);
    handle(body: unknown): Promise<Response>;
    private prepare;
    private consume;
    /**
     * Submit the spend. The account is marked uncertain *before* the request: a
     * transport failure, a timeout or an unreadable answer means the credit may
     * already be gone, so nothing may be retried until a human checked Magpie.
     */
    private spend;
    private verifyIdentity;
    private readFailed;
    private uncertainReply;
}
