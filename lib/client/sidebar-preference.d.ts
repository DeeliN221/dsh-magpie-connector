/**
 * Shared client state of the sidebar quota preferences.
 *
 * The values live in host settings (`sidebarUsage`, `sidebarRefreshMinutes`,
 * `sidebarWindows`),
 * but the sidebar and the settings section are separate slot entries in one
 * client bundle: this small store lets the settings form update the sidebar
 * immediately, and lets both surfaces share one hydration read instead of one
 * per mount.
 *
 * @module dsh-magpie-connector/client/sidebar-preference
 */
import { type Api } from './api.js';
import { type SidebarWindowKind } from '../shared/sidebar-window.js';
/** Auto-refresh interval used when the host setting is absent or unreadable. */
export declare const DEFAULT_REFRESH_MINUTES = 5;
/** Upper bound of the configurable interval; 0 disables auto-refresh. */
export declare const MAX_REFRESH_MINUTES = 1440;
export interface SidebarPreference {
    usage?: boolean | undefined;
    refreshMinutes: number;
    windows: SidebarWindowKind[];
}
export declare const readSidebarPreference: () => SidebarPreference | undefined;
export declare function setSidebarPreference(patch: {
    usage?: boolean;
    refreshMinutes?: number;
    windows?: SidebarWindowKind[];
}): void;
export declare function subscribeSidebarPreference(listener: (value: SidebarPreference | undefined) => void): () => void;
/** Read `sidebarUsage`, `sidebarRefreshMinutes` and `sidebarWindows` once per page; a failed read stays retryable. */
export declare function hydrateSidebarPreference(api: Api | undefined): Promise<void>;
/** Test seam: drop the hydrated value and subscribers between cases. */
export declare function resetSidebarPreference(): void;
