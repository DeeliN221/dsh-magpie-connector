/** One measurement pass over every saved line: readings keyed by line id. `measuring` marks a
 * single row being re-measured on its own (line check), so other rows keep their reading. */
export type LatencyState = {
    phase: 'idle';
} | {
    phase: 'measuring';
} | {
    phase: 'done';
    readings: ReadonlyMap<string, number | null>;
    measuring?: ReadonlySet<string>;
} | {
    phase: 'failed';
};
/** Per-row projection of the panel-wide state. */
export interface LineLatency {
    state: 'idle' | 'measuring' | 'done' | 'failed';
    ms?: number | null;
    level?: number;
}
/** 4 bars at ≤100/250/450/600ms; a null reading (no connect within 600ms) is level 0. */
export declare const latencyLevel: (ms: number) => number;
/** Parse the host's `{lines: [{id, ms}]}` payload; malformed input reads as a failure. */
export declare function parseLatency(body: unknown): Map<string, number | null> | undefined;
/**
 * A row only ever gets a reading when it is saved (has an id) and its address is
 * parseable; unsaved drafts and empty addresses stay idle in every phase.
 */
export declare function lineLatency(state: LatencyState, line: {
    id?: string | undefined;
    baseUrl: string;
}): LineLatency;
