import { endpointOf, probeSocket, PROBE_TIMEOUT_MS } from './selection.js';
const measureSocket = async (host, port, timeoutMs, signal) => {
    const result = await probeSocket(host, port, timeoutMs, signal);
    return result.reachable ? result.ms : null;
};
/**
 * Read-only settings-page measurement: one TCP connect per saved line with a
 * parseable address, all in parallel, each capped by the selection deadline.
 * A `lineId` request measures only that saved line (the line-check refresh).
 * Passes are single-flight per scope (a full pass also serves line requests),
 * never touch settings, credentials or the selector cache, and are aborted on
 * dispose.
 */
const FULL = '*';
export class LatencyController {
    lines;
    measure;
    timeoutMs;
    controllers = new Set();
    passes = new Set();
    disposed = false;
    constructor(lines, options = {}) {
        this.lines = lines;
        this.measure = options.measure ?? measureSocket;
        this.timeoutMs = options.timeoutMs ?? PROBE_TIMEOUT_MS;
    }
    /** `lineId` narrows the pass to one saved line (the line-check refresh); omit for the full panel pass. */
    async read(lineId) {
        if (this.disposed)
            return Response.json({ lines: [] });
        const scope = lineId ?? FULL;
        const readings = await this.pass(scope, lineId);
        return Response.json({ lines: scope === FULL ? readings : readings.filter(reading => reading.id === lineId) });
    }
    pass(scope, lineId) {
        for (const entry of this.passes) {
            // A running full pass already measures this line; reuse it instead of probing twice.
            if (entry.scope === scope || (scope !== FULL && entry.scope === FULL))
                return entry.promise;
        }
        const targets = [];
        for (const line of this.lines()) {
            if (lineId !== undefined && line.id !== lineId)
                continue;
            const endpoint = endpointOf(line.baseUrl);
            if (endpoint)
                targets.push({ id: line.id, host: endpoint.host, port: endpoint.port });
        }
        const measuring = Promise.all(targets.map(async (target) => {
            const controller = new AbortController();
            this.controllers.add(controller);
            try {
                return { id: target.id, ms: await this.measure(target.host, target.port, this.timeoutMs, controller.signal) };
            }
            catch {
                return { id: target.id, ms: null };
            }
            finally {
                this.controllers.delete(controller);
            }
        }));
        const entry = { scope, promise: measuring.finally(() => { this.passes.delete(entry); }) };
        this.passes.add(entry);
        return entry.promise;
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        for (const controller of this.controllers)
            controller.abort();
        this.controllers.clear();
    }
}
