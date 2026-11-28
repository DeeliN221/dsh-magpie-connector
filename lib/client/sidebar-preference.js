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
import { isOk } from './api.js';
import { DEFAULT_SIDEBAR_WINDOWS, normalizeSidebarWindows } from '../shared/sidebar-window.js';
/** Auto-refresh interval used when the host setting is absent or unreadable. */
export const DEFAULT_REFRESH_MINUTES = 5;
/** Upper bound of the configurable interval; 0 disables auto-refresh. */
export const MAX_REFRESH_MINUTES = 1440;
const sanitizeMinutes = (value) => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > MAX_REFRESH_MINUTES)
        return DEFAULT_REFRESH_MINUTES;
    return value;
};
const sanitizeWindows = (value) => normalizeSidebarWindows(value) ?? [...DEFAULT_SIDEBAR_WINDOWS];
let preference;
let hydration;
const listeners = new Set();
export const readSidebarPreference = () => preference;
export function setSidebarPreference(patch) {
    const next = {
        usage: patch.usage ?? preference?.usage,
        refreshMinutes: patch.refreshMinutes ?? preference?.refreshMinutes ?? DEFAULT_REFRESH_MINUTES,
        windows: patch.windows ?? preference?.windows ?? [...DEFAULT_SIDEBAR_WINDOWS],
    };
    if (preference !== undefined && preference.usage === next.usage && preference.refreshMinutes === next.refreshMinutes && preference.windows.join() === next.windows.join())
        return;
    preference = next;
    for (const listener of listeners)
        listener(next);
}
export function subscribeSidebarPreference(listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}
/** Read `sidebarUsage`, `sidebarRefreshMinutes` and `sidebarWindows` once per page; a failed read stays retryable. */
export function hydrateSidebarPreference(api) {
    if (api === undefined)
        return Promise.resolve();
    if (preference !== undefined)
        return Promise.resolve();
    if (hydration !== undefined)
        return hydration;
    hydration = (async () => {
        try {
            const response = await api({ method: 'GET', path: 'settings' });
            if (isOk(response)) {
                const body = response.body;
                setSidebarPreference({ usage: body?.sidebarUsage === true, refreshMinutes: sanitizeMinutes(body?.sidebarRefreshMinutes), windows: sanitizeWindows(body?.sidebarWindows) });
            }
            else
                hydration = undefined;
        }
        catch {
            hydration = undefined;
        }
    })();
    return hydration;
}
/** Test seam: drop the hydrated value and subscribers between cases. */
export function resetSidebarPreference() {
    preference = undefined;
    hydration = undefined;
    listeners.clear();
}
