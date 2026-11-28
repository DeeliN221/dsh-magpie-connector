/** Stop visibility/subscriptions even when another cleanup fails; never delete user data. */
export declare function createDisposer(runtime: {
    dispose(): Promise<void>;
}, releases: (() => unknown)[]): () => Promise<void>;
