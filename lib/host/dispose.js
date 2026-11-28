/** Stop visibility/subscriptions even when another cleanup fails; never delete user data. */
export function createDisposer(runtime, releases) {
    let pending;
    return () => pending ??= (async () => {
        const results = await Promise.allSettled([Promise.resolve().then(() => runtime.dispose()), ...releases.map(release => Promise.resolve().then(release))]);
        const failures = results.flatMap(result => result.status === 'rejected' ? [result.reason] : []);
        if (failures.length)
            throw new AggregateError(failures, 'Magpie disposal failed');
    })();
}
