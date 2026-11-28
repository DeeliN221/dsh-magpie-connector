import type { MagpieRuntime, Operation } from './runtime.js';
import type { Card } from '../client/view-model.js';
/** One reset credit as the host keeps it: the browser never sees the id, the reset flow needs it. */
export interface HostCredit {
    id: string;
    until?: string;
}
/**
 * Cards as the browser sees them, plus the credits the reset flow selects from.
 * `redeemable` only says "this card could offer the button": provider codex, a
 * named account, not a by-window plan, and at least one credit with an id.
 */
export declare function projectCards(body: unknown, redact: (s: string) => string): {
    cards: Card[];
    credits: Map<string, HostCredit[]>;
};
export declare class CardsController {
    readonly runtime: MagpieRuntime;
    constructor(runtime: MagpieRuntime);
    private state;
    private stale;
    private response;
    private validate;
    private send;
    get(): Promise<Response>;
    refresh(body: unknown): Promise<Response>;
    /**
     * A forced read of one card for the reset flow: same gate as a user refresh, so
     * it never runs beside one. Only a 2xx result counts — a failed read leaves the
     * previous (older) cards in place, and those must not authorise spending a
     * credit, so every failure is returned as such. A caller-supplied operation stays
     * retained by that caller through its subsequent write and response projection.
     */
    fresh(target: {
        provider: string;
        user: string;
    }, operation?: Operation): Promise<{
        ok: true;
        card: Card | undefined;
        credits: HostCredit[];
    } | {
        ok: false;
        status: number;
        error: string;
    }>;
    /** Validate + run one read under the caller's operation; shared by `refresh` and `fresh`. */
    private run;
}
