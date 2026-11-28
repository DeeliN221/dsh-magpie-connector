import type { LlmResolvedModelInfo } from '@deepseek-ai/dsh-llm';
/** Fixed pi-ai/replay transport identity. It is NOT a registered LLM route. */
export declare const TRANSPORT_ID = "dsh-magpie-connector";
/** Owner key of a gateway `owned_by` (untrusted): valid lower-cased value, else `other`. */
export declare function ownerKey(ownedBy: unknown): string;
/** Display name depends on the owner key alone, never on catalog content. */
export declare const ownerLabel: (key: string) => string;
export declare const routeOf: (key: string) => string;
export declare const isMagpieRoute: (id: string) => boolean;
/** Owner key of one of our routes; anything else (direct adapter calls) reads as `other`. */
export declare const ownerOfRoute: (route: string) => string;
/** The gateway's `max_output_tokens`, the model's reply capacity; `info.defaultMaxTokens` is the smaller per-request budget. */
/** Owner and visibility key of every routing entry (`group/…`, `auto/…`): Magpie routing groups belong to no vendor. */
export declare const ROUTING_OWNER = "routing";
export type RoutingKind = 'auto' | 'custom';
/** Routing entry type by id prefix only (case-sensitive); labels are presentation text and never decide the type. */
export declare const routingKindOf: (id: string) => RoutingKind | undefined;
export interface CatalogModel {
    info: LlmResolvedModelInfo; /** Visibility key: raw `owned_by`, else the id's first segment; `routing` for routing entries. */
    provider: string; /** Owner key that selects the route. */
    owner: string;
    routingKind?: RoutingKind; /** Routing entries only: the vendor owner they list under while `routing` is not admitted. */
    fallbackOwner?: string;
    efforts: string[];
    nativeEndpoints: string[];
    serviceTiers: string[];
    outputLimit?: number;
}
/**
 * DSH compaction-basic's default `headroomTokens` (DSH 0.2.0-rc.2, lib/index.js) and Magpie's `dshHeadroom`.
 * Re-check on every DSH upgrade: DSH reserves `defaultMaxTokens` plus this headroom out of the window before compacting.
 */
export declare const COMPACTION_HEADROOM_TOKENS = 65536;
/** Magpie's `dshMaxTokens` (without its user-set Max output exception, which /models does not expose). */
export declare const defaultOutputBudget: (contextWindow: number | undefined, outputLimit: number) => number;
export declare const strings: (value: unknown) => string[];
export declare function mapCatalog(body: unknown): CatalogModel[];
