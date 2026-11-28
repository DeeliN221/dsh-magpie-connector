/**
 * Which gateway windows the sidebar usage card lists, and in what order. Shared
 * by the host (settings persistence and request validation) and the client (row
 * building) so the two lists cannot drift; no runtime dependency, bundled into
 * both builds.
 *
 * The selection is a non-empty subset: with one kind selected the card keeps the
 * compact one-line row, with several it lists one line per window. Gateways name
 * windows freely, so the kinds are the spans they describe: 5 hours, weekly,
 * monthly.
 *
 * @module dsh-magpie-connector/shared/sidebar-window
 */
/** The concrete windows a gateway reports and the card can list, short span first. */
export type SidebarWindowKind = 'fiveHour' | 'weekly' | 'monthly';
/** Canonical order: 5-hour, weekly, monthly (also the order of a card's window lines). */
export declare const SIDEBAR_WINDOW_KINDS: readonly ["fiveHour", "weekly", "monthly"];
/** Before this setting existed the card showed the weekly window only. */
export declare const DEFAULT_SIDEBAR_WINDOWS: readonly SidebarWindowKind[];
export declare const isSidebarWindowKind: (value: unknown) => value is SidebarWindowKind;
/**
 * Validate and canonicalise a stored or requested selection: a non-empty subset
 * of the known kinds, deduplicated and reordered canonically. `null` means the
 * whole value is invalid (unknown member, empty list, not an array) so callers
 * reject it instead of silently repairing it.
 */
export declare function normalizeSidebarWindows(value: unknown): SidebarWindowKind[] | null;
/**
 * 0.6.7 stored a single tier as `sidebarWindow: 'weekly' | 'fiveHour' |
 * 'tightest'`. Read it once so an existing preference is not silently lost; the
 * legacy key is never written back.
 */
export declare function migrateLegacySidebarWindow(value: unknown): SidebarWindowKind[] | null;
