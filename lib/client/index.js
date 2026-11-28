import { MagpieSettings } from './SettingsPage.js';
import { ensureStyles } from './styles.js';
import { SidebarUsage } from './SidebarUsage.js';
import { SpeedSelect, createModelWatcher, createSpeedLoader, createSpeedSetter } from './SpeedSelect.js';
import { createFetchApi } from './api.js';
import { MagpieSettingsNavIcon } from './settings-nav-icon.js';
import { NS, bindLocale, en, zh } from './locales.js';
export const name = 'dsh-magpie-connector/client';
export const inject = ['slots', 'locale'];
export function apply(ctx, api = createFetchApi()) {
    // Return the locale disposer: a client bundle rebuilt while the page is open
    // re-applies this entry against the same long-lived locale service, which
    // refuses a namespace it already holds ("already has locale"). Leaking the
    // old dictionaries made every hot reload fail and took the sidebar card,
    // settings section and speed control down until a page reload.
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-magpie-connector: dictionaries');
    ctx.effect(() => { const element = ensureStyles(); return () => { element?.remove(); }; }, 'dsh-magpie-connector: styles');
    bindLocale(ctx.locale.bind(NS));
    const label = () => 'Magpie';
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section', id: 'dsh-magpie-connector', order: 13,
        label,
        inject: () => ({ api }),
    }, MagpieSettings));
    ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
        name: 'settings.section.icon', id: 'dsh-magpie-connector',
    }, MagpieSettingsNavIcon));
    // Current model comes from ui-model-selection's `modelDirectories`, resolved lazily
    // per read so registration order never matters (same as subscriptions' Speed).
    // Sidebar quota card: the owner slot passes `wide` as an owner prop; the
    // injected face only carries the API.
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action', id: 'magpie-usage', order: 10,
        inject: () => ({ api }),
    }, SidebarUsage));
    // Current model comes from ui-model-selection's `modelDirectories`, resolved lazily
    // per read so registration order never matters (same as subscriptions' Speed).
    const models = () => ctx.get('modelDirectories');
    ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
        name: 'conversation.input.right', id: 'dsh-magpie-connector-speed', order: 1,
        inject: (sessionId) => {
            const id = typeof sessionId === 'string' ? sessionId : '';
            return { loadSpeed: createSpeedLoader(api, models, id), setSpeed: createSpeedSetter(api, id), watchModel: createModelWatcher(models, id) };
        },
    }, SpeedSelect));
}
