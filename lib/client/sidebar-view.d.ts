/**
 * Pure helpers for the sidebar usage card. No React, no locale binding: the
 * component owns copy, this module owns which window is shown and how a value
 * is compared, so the rules stay testable without a DOM.
 *
 * @module dsh-magpie-connector/client/sidebar-view
 */
import type { Card, CardWindow } from './view-model.js';
import { type SidebarWindowKind } from '../shared/sidebar-window.js';
/** Colour tier of one reading; same thresholds as the settings page (AMD4). */
export type UsageLevel = 'normal' | 'warn' | 'high';
export declare const usedLevel: (used: number) => UsageLevel;
/** The reading shows text (`unlimited`, a gateway `display`), not the `used` percentage: no bar, no colour, not a fallback candidate. */
export declare const textReading: (window: Pick<CardWindow, "display" | "unlimited">) => boolean;
/** One window line inside a card block: which window, its reading, and why it is there. */
export interface SidebarWindowRow {
    window: CardWindow;
    /** The configured kind this line answers, or `other` when the upstream reports none of them. */
    kind: SidebarWindowKind | 'other';
    /** Clamped used percentage when the gateway reported a usable number. */
    used?: number;
    /** Gateway display string, rendered verbatim. */
    display?: string;
    unlimited?: boolean;
    /** None of the configured kinds exist upstream, so this is the best the card has. */
    fallback?: boolean;
}
/** One upstream block: its name, one line per configured window, and a balance fallback. */
export interface SidebarRow {
    card: Card;
    windows: SidebarWindowRow[];
    /** Balance-only accounts (no quota windows): shown instead of a dash. */
    balance?: string;
    /** The card itself failed: the block shows the failure instead of readings. */
    failed: boolean;
}
/**
 * Blocks in gateway order (the product decision: no current-first, no severity
 * sort). Each block lists one line for every configured kind the upstream really
 * reports, `fiveHour` before `weekly`; when it reports none of them the block
 * falls back to its highest numeric window, then to a `display`/unlimited one,
 * and a balance-only account keeps its balance. Nothing is invented.
 */
export declare function sidebarRows(cards: Card[], kinds?: readonly SidebarWindowKind[]): SidebarRow[];
/** `8` → `8%`, `70.5` → `70.5%` (same rounding as the settings page). */
export declare const formatUsed: (used: number) => string;
/** Whole minutes since a gateway read timestamp; undefined when unparseable. */
export declare function ageMinutes(readAt: string | undefined, now: number): number | undefined;
/**
 * Compact reset label for the 220px expanded card: `19:20` when it is today,
 * `11/10 11:00` within the year, otherwise the full date. The full timestamp is
 * always available in `title` and on the settings page.
 */
export declare function formatResetShort(resetsAt: string | undefined, now: number): string | undefined;
/**
 * Reset label for one compact sidebar row: always a date and a clock
 * (`11/10 11:00`, `2027/1/2 09:05` when it is another year). The compact row
 * keeps the date even for a reset later today on purpose: the gateway's window
 * name (`7 days`) says nothing about when the quota comes back, and the row has
 * no other place to put it.
 */
export declare function formatResetDeadline(resetsAt: string | undefined, now: number): string | undefined;
/** Stable identity of one card across reads: provider + account. */
export declare const cardIdentity: (card: Pick<Card, "provider" | "user">) => string;
export declare const cardReadTime: (card: Card) => string | undefined;
/**
 * Did a full refresh leave every card's read time untouched? Same rule the
 * settings page uses for "Magpie did not re-read (throttled)".
 */
export declare function unchangedReads(previous: Card[], next: Card[]): boolean;
/** One provider's cards in the sidebar: gateway order, grouped where the provider first appears. */
export interface SidebarGroup {
    provider: string;
    /** Card indexes into the input array, in gateway order. */
    indexes: number[];
}
/** Group same-provider cards at the provider's first appearance; a one-card group renders as before. */
export declare function sidebarGroups(cards: Pick<Card, 'provider'>[]): SidebarGroup[];
/** The account's own name inside a multi-account group, or undefined so the caller numbers it. */
export declare const accountUser: (card: Pick<Card, "user">) => string | undefined;
