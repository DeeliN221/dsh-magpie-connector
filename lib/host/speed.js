function validateSession(session) {
    if (typeof session !== 'string' || !session || session.length > 256)
        throw new Error('Invalid session');
}
export class SpeedController {
    fast = new Set();
    get(session, catalog = []) {
        validateSession(session);
        return { tier: this.fast.has(session) ? 'fast' : 'standard', fastModels: catalog.filter(m => m.serviceTiers.includes('priority')).map(m => m.info.id) };
    }
    set(session, tier) {
        validateSession(session);
        if (tier !== 'standard' && tier !== 'fast')
            throw new Error('Invalid tier');
        if (tier === 'fast')
            this.fast.add(session);
        else
            this.fast.delete(session);
    }
    /** Call at stream time with prepareCall's captured model capabilities. */
    priority(session, model) {
        return session !== undefined && this.fast.has(session) && model.serviceTiers.includes('priority') ? 'priority' : undefined;
    }
}
