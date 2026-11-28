import { type Api } from './api.js';
/**
 * Sidebar usage card (`sidebar.footer.action`, owner prop `wide`).
 *
 * Wide sidebar: an accordion. The header row is the only interactive surface
 * (except the refresh button): clicking it toggles the detail, which grows in
 * flow and takes height away from the session list instead of covering it.
 * Collapsed, it shows one weekly row per upstream (the body caps at 320px) plus a
 * decorative overflow chevron. Collapsed sidebar: one icon that opens the same
 * content as a 320px anchored popover.
 *
 * Reads are event-driven through `sidebar-api` (60s TTL). The opt-in timer is
 * the one exception: it performs a real refresh (`POST {all:true}`) because the
 * gateway answers a card read from its kept cards and only re-reads a vendor
 * when a refresh is asked for.
 */
export interface SidebarUsageProps {
    api?: Api;
    wide?: boolean;
}
export declare function SidebarUsage({ api, wide }: SidebarUsageProps): import("react").FunctionComponentElement<import("react").FragmentProps> | import("react").DetailedReactHTMLElement<{
    className: string;
    'data-dmg-sidebar': string;
    'data-open': boolean;
}, HTMLElement> | null;
