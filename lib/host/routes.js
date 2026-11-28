import { isVisible, validateVisibility } from './visibility.js';
import { updateDefaultEffort } from './default-effort.js';
import { CardsController } from './cards.js';
import { ResetController } from './reset.js';
import { SpeedController } from './speed.js';
import { LatencyController } from './latency.js';
import { normalizeSidebarWindows } from '../shared/sidebar-window.js';
export class SettingsController {
    runtime;
    pending = Promise.resolve();
    constructor(runtime) {
        this.runtime = runtime;
    }
    async handle(body) {
        if (body === undefined)
            return this.execute();
        const result = this.pending.then(() => this.execute(body));
        this.pending = result.then(() => { }, () => { });
        return result;
    }
    async execute(body) {
        const runtime = this.runtime;
        if (body !== undefined) {
            try {
                if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['lines', 'resync', 'visibleModels', 'defaultEffort', 'sidebarUsage', 'sidebarRefreshMinutes', 'sidebarWindows'].includes(k)))
                    throw new Error('Invalid settings');
                const input = body;
                // Validate the entire union before credentials, disk writes or synchronization.
                if ('lines' in input) {
                    if (!Array.isArray(input.lines))
                        throw new Error('Invalid lines');
                    if (input.lines.length < 1 || input.lines.length > 5)
                        throw new Error('Invalid lines');
                }
                if ('key' in input && input.key !== null && (typeof input.key !== 'string' || !input.key || input.key.length > 512 || /\s/.test(input.key)))
                    throw new Error('Invalid API key');
                if ('resync' in input && input.resync !== true)
                    throw new Error('Invalid resync');
                const visibleModels = 'visibleModels' in input ? validateVisibility(input.visibleModels) : undefined;
                if ('sidebarUsage' in input && typeof input.sidebarUsage !== 'boolean')
                    throw new Error('Invalid sidebarUsage');
                if ('sidebarRefreshMinutes' in input && (!Number.isInteger(input.sidebarRefreshMinutes) || input.sidebarRefreshMinutes < 0 || input.sidebarRefreshMinutes > 1440))
                    throw new Error('Invalid sidebarRefreshMinutes');
                if ('sidebarWindows' in input && normalizeSidebarWindows(input.sidebarWindows) === null)
                    throw new Error('Invalid sidebarWindows');
                const sidebarUsage = 'sidebarUsage' in input ? input.sidebarUsage : undefined;
                const sidebarRefreshMinutes = 'sidebarRefreshMinutes' in input ? input.sidebarRefreshMinutes : undefined;
                const sidebarWindows = normalizeSidebarWindows(input.sidebarWindows) ?? undefined;
                const defaultEfforts = 'defaultEffort' in input ? updateDefaultEffort(runtime.store.value.defaultEfforts, input.defaultEffort, runtime.current.catalog) : undefined;
                const connection = Object.fromEntries(Object.entries(input).filter(([k]) => ['lines', 'resync'].includes(k)));
                if (Object.keys(connection).length) {
                    const result = await runtime.settings(connection);
                    if (!result.ok)
                        return result;
                }
                if (visibleModels !== undefined || defaultEfforts !== undefined || sidebarUsage !== undefined || sidebarRefreshMinutes !== undefined || sidebarWindows !== undefined) {
                    runtime.savePreferences({ ...(visibleModels === undefined ? {} : { visibleModels }), ...(defaultEfforts === undefined ? {} : { defaultEfforts }), ...(sidebarUsage === undefined ? {} : { sidebarUsage }), ...(sidebarRefreshMinutes === undefined ? {} : { sidebarRefreshMinutes }), ...(sidebarWindows === undefined ? {} : { sidebarWindows }) });
                    if (visibleModels !== undefined || defaultEfforts !== undefined)
                        runtime.publish();
                }
            }
            catch (error) {
                return Response.json({ error: runtime.redact(error instanceof Error ? error.message : String(error)) }, { status: 400 });
            }
        }
        const response = await runtime.settings();
        const view = await response.json();
        view.groups = [...new Set(runtime.current.catalog.map(m => m.provider))].map(provider => ({ provider, models: runtime.current.catalog.filter(m => m.provider === provider).map(m => ({ id: m.info.id, name: m.info.name, efforts: m.efforts, ...(m.routingKind ? { routingKind: m.routingKind } : {}), visible: isVisible(m, runtime.store.value.visibleModels) })) }));
        return Response.json(runtime.redactJson(view));
    }
}
/** Register on the injected connection.fetch; caller owns the returned disposer. */
export function registerRoutes(fetch, runtime, speed = new SpeedController(), cards = new CardsController(runtime), latency = new LatencyController(() => runtime.config()), reset = new ResetController(runtime, cards)) {
    const settings = new SettingsController(runtime);
    const handlers = {
        settings: async (request, body) => settings.handle(request.method === 'POST' ? body : undefined),
        cards: async (request, body) => request.method === 'POST' ? cards.refresh(body) : cards.get(),
        speed: async (request, body) => {
            const session = request.method === 'GET' ? new URL(request.url).searchParams.get('session') : body?.session;
            if (request.method === 'POST') {
                if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['session', 'tier'].includes(k)))
                    throw new Error('Invalid speed request');
                speed.set(session, body.tier);
            }
            return Response.json(speed.get(session, runtime.current.catalog));
        },
        lineCheck: async (_request, body) => runtime.lineCheck(body),
        latency: async (request) => latency.read(new URL(request.url).searchParams.get('line') ?? undefined),
    };
    /** GET-only latency diagnostics; every other resource keeps the GET/POST surface. */
    const resources = ['settings', 'cards', 'speed', 'latency'];
    const methodsOf = (resource) => resource === 'latency' ? ['GET'] : ['GET', 'POST'];
    const disposers = [];
    try {
        for (const resource of resources)
            disposers.push(fetch.register({ path: `/api/dsh-magpie-connector/${resource}`, methods: methodsOf(resource), requestBody: 'buffered', fetch: async (request) => {
                    try {
                        const body = request.method === 'POST' ? await request.json() : undefined;
                        return await handlers[resource](request, body);
                    }
                    catch (error) {
                        return Response.json({ error: runtime.redact(error instanceof Error ? error.message : String(error)) }, { status: 400 });
                    }
                } }));
        disposers.push(fetch.register({ path: '/api/dsh-magpie-connector/line-check', methods: ['POST'], requestBody: 'buffered', fetch: async (request) => {
                try {
                    return await handlers.lineCheck(request, await request.json());
                }
                catch (error) {
                    return Response.json({ error: runtime.redact(error instanceof Error ? error.message : String(error)) }, { status: 400 });
                }
            } }));
        /** Write path for an irreversible action: POST only, never on the read surface above. */
        disposers.push(fetch.register({ path: '/api/dsh-magpie-connector/reset', methods: ['POST'], requestBody: 'buffered', fetch: async (request) => {
                try {
                    return await reset.handle(await request.json());
                }
                catch (error) {
                    return Response.json({ error: runtime.redact(error instanceof Error ? error.message : String(error)) }, { status: 400 });
                }
            } }));
    }
    catch (error) {
        for (const dispose of disposers.reverse())
            dispose();
        throw error;
    }
    let disposed = false;
    return { settings, cards, speed, latency, reset, dispose: () => { if (disposed)
            return; disposed = true; latency.dispose(); for (const dispose of disposers.reverse())
            dispose(); } };
}
