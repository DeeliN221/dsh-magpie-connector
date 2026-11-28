import { type Api } from './api.js';
export declare function isMagpieRoute(provider: string): boolean;
export type Tier = 'standard' | 'fast';
export interface SpeedState {
    visible: boolean;
    tier: Tier;
}
type Selection = {
    provider: string;
    model: string;
} | null;
export interface ModelDirectories {
    directoryFor(sessionId: string): {
        load(): Promise<{
            current: Selection;
        }>;
        store?: {
            getSnapshot(): {
                current?: Selection;
            } | undefined;
            subscribe(listener: () => void): () => void;
        };
    };
}
/**
 * Calls `onChange` when the session's selected provider/model changes. Other store
 * updates (including the ones our own `load()` causes) are ignored, so a reload
 * never re-triggers itself. No-op when the store is unavailable.
 */
export declare function createModelWatcher(models: () => ModelDirectories | undefined, sessionId: string): (onChange: () => void) => () => void;
export declare function createSpeedLoader(api: Api, models: () => ModelDirectories | undefined, sessionId: string): () => Promise<SpeedState>;
export declare function createSpeedSetter(api: Api, sessionId: string): (tier: Tier) => Promise<boolean>;
export declare function SpeedSelect({ loadSpeed, setSpeed, watchModel }: {
    loadSpeed?: () => Promise<SpeedState>;
    setSpeed?: (tier: Tier) => Promise<boolean>;
    watchModel?: (onChange: () => void) => () => void;
}): import("react").DetailedReactHTMLElement<{
    ref: import("react").RefObject<HTMLDivElement | null>;
    className: string;
    'data-magpie-speed': string;
    onKeyDown: (event: {
        key: string;
        preventDefault(): void;
    }) => void;
}, HTMLDivElement> | null;
export {};
