/**
 * Data layer of the sidebar usage card: one 60s TTL cache, event-driven reads
 * and one forced refresh.
 *
 * The host's `GET cards` performs a real gateway request every time (only
 * concurrent reads are coalesced) but the gateway answers it from the cards it
 * last read, so only `refreshCards` (the header button and the opt-in
 * auto-refresh timer) can bring fresh readings. The cache lives here and the
 * component calls `loadCards` only on events (mount, expanding, page visible
 * again); `refreshCards` bypasses it.
 *
 * @module dsh-magpie-connector/client/sidebar-api
 */
import { type Api } from './api.js';
import { type CardsView } from './view-model.js';
/** How long a successful read is reused for event-driven mounts. */
export declare const SIDEBAR_TTL_MS = 60000;
/** Test seam: forget the module-level cache between cases. */
export declare function resetSidebarCardsCache(): void;
export interface ReadOptions {
    now?: () => number;
    force?: boolean;
}
/** Read the cards, reusing a read younger than {@link SIDEBAR_TTL_MS} unless forced. */
export declare function loadCards(api: Api, options?: ReadOptions): Promise<CardsView>;
export type RefreshResult = {
    ok: true;
    view: CardsView;
    status: number;
} | {
    ok: false;
    status: number;
    error: string;
};
/** Full refresh (`{all:true}`); a failure keeps the previous cache untouched. */
export declare function refreshCards(api: Api, options?: {
    now?: () => number;
}): Promise<RefreshResult>;
