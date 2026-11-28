import { type Api } from './api.js';
/**
 * Web half of dsh-magpie-connector. Talks to the host only through the four D10
 * resources (`/api/dsh-magpie-connector/{settings,cards,speed,latency}`), same-origin fetch as
 * dsh-magpie-connect does (the shell's connection authenticates the page).
 * Types are kept minimal on purpose: no dsh-client-* type packages needed.
 */
interface SlotRegistration {
    name: string;
    id: string;
    order?: number;
    label?: () => string;
    inject?: (owner?: unknown) => unknown;
}
/** Minimal locale face: register the dictionaries once and bind a translator. `register` answers the disposer that releases the namespace. */
interface LocaleService {
    register(namespace: string, dictionaries: {
        zh: Record<string, string>;
        en: Record<string, string>;
    }): () => void;
    bind(namespace: string): (key: string) => string;
}
interface ClientContext {
    slots: {
        inject(name: string, register: () => unknown): void;
        register(registration: SlotRegistration, component: unknown): unknown;
    };
    locale: LocaleService;
    get(name: string): unknown;
    effect(run: () => () => void, label: string): unknown;
}
export declare const name = "dsh-magpie-connector/client";
export declare const inject: string[];
export declare function apply(ctx: ClientContext, api?: Api): void;
export {};
