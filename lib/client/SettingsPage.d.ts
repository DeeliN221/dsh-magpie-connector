import { type Api } from './api.js';
import { type CheckSnapshot, type SettingsView } from './view-model.js';
/**
 * Does this submitted list touch the active line's identity? Only then the old usage cards must
 * disappear before the request is even sent (the host writes credentials before awaiting its
 * catalog sync, which can take up to 15s).
 */
export declare function touchesActiveIdentity(lines: unknown[], view: SettingsView): boolean;
/** One line of the read-only snapshot: kind, model count, diff against the cache and latency. */
export declare function describeCheck(snapshot: CheckSnapshot, diff: {
    added: string[];
    removed: string[];
} | undefined, lastSyncAt: string | undefined): string;
export declare function MagpieSettings({ api }: {
    api: Api;
}): import("react").DetailedReactHTMLElement<{
    className: string;
}, HTMLElement>;
/**
 * Why the host or the gateway said no, in the page's words. The host's codes are
 * fixed strings; anything else falls back to its (already redacted) message.
 */
export declare function resetErrorText(response: {
    status: number;
    body: unknown;
}): string;
