const codeOf = (error) => String(error?.code ?? 'UNKNOWN');
const routeIn = (error) => /provider "([^"]+)"/.exec(String(error?.message ?? ''))?.[1];
/**
 * D6 host-call semantics:
 * - initial `registerAdapter`: any throw is a fatal start-up state (the host may have committed routes without
 *   returning a handle, so nothing can be retried or undone) and the host is never called again;
 * - `replace`: DUPLICATE_ADAPTER / INVALID_ADAPTER left the registry unchanged and are reported; INVARIANT means
 *   the host already committed the new set, so it counts as success;
 * - after dispose every call is a no-op.
 */
export function createRouteRegistrar(llm, adapter) {
    let handle, held = [], fatal, disposed = false;
    return {
        publish(next) {
            if (disposed)
                return { ok: true };
            if (fatal)
                return { ok: false, phase: 'initial', ...fatal };
            if (!handle) {
                if (!next.length)
                    return { ok: true };
                try {
                    handle = llm.registerAdapter(next, adapter);
                    held = [...next];
                    return { ok: true };
                }
                catch (error) {
                    const route = routeIn(error);
                    fatal = { code: codeOf(error), ...(route ? { route } : {}) };
                    return { ok: false, phase: 'initial', ...fatal };
                }
            }
            try {
                handle.replace(next);
                held = [...next];
                return { ok: true };
            }
            catch (error) {
                const code = codeOf(error);
                if (code === 'INVARIANT') {
                    held = [...next];
                    return { ok: true };
                }
                const route = routeIn(error);
                return { ok: false, phase: 'replace', code, ...(route ? { route } : {}) };
            }
        },
        current: () => [...held],
        fatal: () => fatal,
        dispose() {
            disposed = true;
            const release = handle;
            handle = undefined;
            release?.();
        },
    };
}
