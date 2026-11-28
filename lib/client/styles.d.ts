export declare const settingsCss: string;
/** Marker on the document-level stylesheet so a re-apply can find it again. */
export declare const STYLE_ATTR = "data-dmg-magpie-styles";
/**
 * Add the plugin stylesheet to `document.head` once and return it.
 *
 * The styles must not live inside a component: the settings section, the wide
 * sidebar card and the rail popover are three different slot/portal trees, and a
 * slot remount or a client-plugin reload that drops one of those subtrees used
 * to take the `<style>` element with it — leaving the card as raw text (the
 * classic "unstyled after a rebuild/restart" symptom). Document-level injection
 * with a marker keeps the sheet independent of any mount lifecycle.
 */
export declare function ensureStyles(): HTMLStyleElement | null;
