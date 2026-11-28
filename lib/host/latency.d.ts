import type { LineSettings } from './settings.js';
/** One measured line: connect time in ms, or null when no connect completed in time. */
export interface LatencyReading {
    id: string;
    ms: number | null;
}
/** Injected probe seam: resolve to the connect time, or null when the deadline passed. */
export type Measure = (host: string, port: number, timeoutMs: number, signal?: AbortSignal) => Promise<number | null>;
export interface LatencyControllerOptions {
    measure?: Measure;
    timeoutMs?: number;
}
export declare class LatencyController {
    private readonly lines;
    private readonly measure;
    private readonly timeoutMs;
    private readonly controllers;
    private readonly passes;
    private disposed;
    constructor(lines: () => LineSettings[], options?: LatencyControllerOptions);
    /** `lineId` narrows the pass to one saved line (the line-check refresh); omit for the full panel pass. */
    read(lineId?: string): Promise<Response>;
    private pass;
    dispose(): void;
}
