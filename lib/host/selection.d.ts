import type { LineSettings } from './settings.js';
/** Per-candidate TCP deadline; covers DNS lookup because the timer starts first. */
export declare const PROBE_TIMEOUT_MS = 600;
/** Reuse a successful reachability verdict for this long. */
export declare const POSITIVE_TTL_MS = 10000;
/** Reuse a failed reachability verdict for this long. */
export declare const NEGATIVE_TTL_MS = 15000;
export type Probe = (host: string, port: number, timeoutMs: number, signal?: AbortSignal) => Promise<boolean>;
export interface Endpoint {
    host: string;
    port: number;
}
/** Parse a configured line URL into a TCP endpoint; IPv6 literals lose brackets. */
export declare function endpointOf(url: string): Endpoint | undefined;
export interface SocketProbeResult {
    reachable: boolean;
    /** TCP connect time in ms (DNS lookup included), clamped to a non-negative integer. */
    ms: number;
}
/** TCP reachability and connect timing only: no HTTP request, no credentials. */
export declare function probeSocket(host: string, port: number, timeoutMs: number, signal?: AbortSignal): Promise<SocketProbeResult>;
/** TCP reachability only; thin wrapper kept so `Probe` and its callers stay unchanged. */
export declare function probePort(host: string, port: number, timeoutMs: number, signal?: AbortSignal): Promise<boolean>;
export interface LineSelectorOptions {
    probe?: Probe;
    now?: () => number;
    positiveTtlMs?: number;
    negativeTtlMs?: number;
    timeoutMs?: number;
}
/**
 * Chooses the active line by priority order: the first reachable complete line
 * wins; reachability verdicts are cached in memory (10s positive / 15s
 * negative) and invalidated on line edits, line deletion, connection-phase
 * failures and dispose. A single-line list is returned without probing.
 */
export declare class LineSelector {
    private readonly probe;
    private readonly now;
    private readonly positiveTtlMs;
    private readonly negativeTtlMs;
    private readonly timeoutMs;
    private readonly cache;
    private readonly controllers;
    private disposed;
    constructor(options?: LineSelectorOptions);
    private key;
    private cached;
    /** Drop cached verdicts for one line (id) or all lines. */
    invalidate(lineId?: string): void;
    reachable(line: LineSettings): Promise<boolean>;
    /** First reachable line by priority, or the first line when none is known reachable. */
    select(lines: LineSettings[]): Promise<LineSettings | undefined>;
    dispose(): void;
}
