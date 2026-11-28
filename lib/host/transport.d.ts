import type { AccessMode } from './settings.js';
export interface ConnectionIdentity {
    baseUrl: string;
    key: string;
    accessClientId?: string;
    accessClientSecret?: string;
    /** Line the request was captured for; used for probe-cache invalidation. */
    lineId?: string;
    /** `direct` lines never carry Access headers, whatever is stored for them. */
    accessMode?: AccessMode;
}
export declare function validateIdentity(identity: ConnectionIdentity): void;
export declare class GatewayTransport {
    readonly signal: AbortController;
    /** Called when a request fails before the connection was established. */
    onConnectionFailure?: (lineId: string) => void;
    private readonly agent;
    private readonly modelDispatcher;
    request(identity: ConnectionIdentity, method: string, path: string, init?: RequestInit): Promise<Response>;
    fetchFor(identity: ConnectionIdentity): typeof fetch;
    dispose(): Promise<void>;
}
