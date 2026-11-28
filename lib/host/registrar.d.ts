import type { LlmAdapter } from '@deepseek-ai/dsh-llm';
/** Outcome of one host call; the registrar applies host semantics only, never owner policy. */
export type PublishResult = {
    ok: true;
} | {
    ok: false;
    phase: 'initial' | 'replace';
    code: string;
    route?: string;
};
export interface RouteRegistrar {
    /** Make `next` the full route set: first call registers, later calls `replace`. */
    publish(next: string[]): PublishResult;
    /** Routes the host currently holds for this plugin (as far as the plugin can know). */
    current(): string[];
    /** Set once the initial registration threw; the plugin must then never call the host again. */
    fatal(): undefined | {
        code: string;
        route?: string;
    };
    /** Release the registration handle. May throw (host `INVARIANT`); callers isolate it. */
    dispose(): void;
}
type Registry = {
    registerAdapter(providers: string[], adapter: LlmAdapter): unknown;
};
/**
 * D6 host-call semantics:
 * - initial `registerAdapter`: any throw is a fatal start-up state (the host may have committed routes without
 *   returning a handle, so nothing can be retried or undone) and the host is never called again;
 * - `replace`: DUPLICATE_ADAPTER / INVALID_ADAPTER left the registry unchanged and are reported; INVARIANT means
 *   the host already committed the new set, so it counts as success;
 * - after dispose every call is a no-op.
 */
export declare function createRouteRegistrar(llm: Registry, adapter: LlmAdapter): RouteRegistrar;
export {};
