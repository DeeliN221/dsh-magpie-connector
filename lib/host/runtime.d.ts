import { type CredentialProvider, type CredentialRef } from '@deepseek-ai/dsh-credentials';
import { SettingsStore, type AccessMode, type CredentialField, type LineSettings, type Settings } from './settings.js';
import { GatewayTransport, type ConnectionIdentity } from './transport.js';
import { LineSelector, type Probe } from './selection.js';
import { type CatalogModel } from './catalog.js';
import { type SidebarWindowKind } from '../shared/sidebar-window.js';
/** Effective sidebar window selection: stored value, else the 0.6.7 legacy string, else the default. */
export declare const sidebarWindowsOf: (value: Pick<Settings, "sidebarWindows" | "sidebarWindow">) => SidebarWindowKind[] | null;
export type Credentials = Pick<CredentialProvider, 'describe' | 'resolve' | 'set' | 'unset'>;
/** Credential references bound to a line's stable random id. */
export declare function lineCredentialRefs(lineId: string): Record<CredentialField, CredentialRef>;
/** Inverse of {@link lineCredentialRefs} for credential-update events; undefined = not a line ref. */
export declare function lineIdOfCredentialRef(ref: unknown): string | undefined;
export interface Generation {
    id: number;
    lineId: string;
    baseUrl: string;
    accessMode: AccessMode;
    keyFingerprint: string;
    catalog: CatalogModel[];
    bgAbort: AbortController;
    syncPromise?: Promise<void>;
    lastSyncAt?: string;
    lastSyncError?: string;
    lastSyncErrorKind?: string;
    [key: string]: unknown;
}
export interface Operation extends ConnectionIdentity {
    gen: Generation;
    connectionVersion: number;
    release(): void;
}
export interface RuntimeOptions {
    probe?: Probe;
    now?: () => number;
    /** Deterministic id seam for tests; defaults to 8 random hex chars. */
    newId?: (existing: readonly string[]) => string;
    /** Whole-check budget override (tests use a short one); defaults to {@link CHECK_TIMEOUT_MS}. */
    checkTimeoutMs?: number;
}
/** One check of a draft line: reachability + auth + catalog summary only. */
export type LineCheckKind = 'ok' | 'unauthorized' | 'forbidden' | 'http' | 'redirect' | 'unreachable' | 'timeout' | 'invalid-catalog' | 'incomplete' | 'invalid' | 'busy' | 'pending';
export interface LineCheckResult {
    kind: LineCheckKind;
    gatewayStatus?: number;
    reason?: string;
    latencyMs: number;
    modelCount?: number;
    models?: {
        id: string;
    }[];
    testedAt: string;
}
/** Whole-check budget: connect, headers, body and parsing share it. */
export declare const CHECK_TIMEOUT_MS = 5000;
/** Longest `reason` the check returns (redacted first, then truncated). */
export declare const CHECK_REASON_MAX = 300;
/** Longest underlying cause echoed in a settings write failure (redacted first, then truncated). */
export declare const WRITE_CAUSE_MAX = 300;
/**
 * Host half of the connector, single-schema (BREAKING) design. Owns the ordered
 * line list, the active-line identity (line id + address + access mode + that
 * line's credential fingerprint) and the generation that guards stale results.
 * Legacy `baseUrl` settings and legacy fixed credential refs are intentionally
 * not read or migrated.
 */
export declare class MagpieRuntime {
    readonly credentials: Credentials;
    readonly store: SettingsStore;
    readonly publish: (routes?: string[]) => void;
    current: Generation;
    readonly transport: GatewayTransport;
    readonly selector: LineSelector;
    private activeKeys;
    private prepared;
    private currentSecrets;
    private failedFields;
    private retained;
    private updating;
    private disposed;
    private saving;
    /** Validated `knownOwners`; the route set is derived from it. */
    private owners;
    private knownOwnersReset;
    private rejectedOwners;
    /** Set once the initial route registration failed: no further owner admission or publishing (needs a Host restart). */
    private registrationError;
    private readonly newId;
    /** Bumped by every connection write (and credential event): guards asynchronous connection reads. */
    private writeVersion;
    private checking;
    readonly checkTimeoutMs: number;
    selectedLineId: string | null;
    constructor(credentials: Credentials, store?: SettingsStore, publish?: (routes?: string[]) => void, options?: RuntimeOptions);
    /** Route ids of the persisted owners: the full set the adapter should own. */
    routeSet(): string[];
    /** Owner whose route lists `model`: a routing entry stays under its vendor while `routing` is not admitted (cap full, conflict). */
    ownerOf(model: CatalogModel): string;
    private emit;
    /**
     * The only settings write path. Synchronous (no await inside), so two writes can never interleave;
     * the base is the in-memory known fields AT CALL TIME (never a snapshot from before an await) and
     * unknown fields (e.g. the legacy `baseUrl`) are not written back. Throws when the disk write fails,
     * leaving the in-memory value unchanged.
     */
    writeSettings(patch: {
        [K in keyof Settings]?: Settings[K] | undefined;
    }): void;
    /** Strict load: any invalid persisted line/pending makes the whole connection read as empty. */
    private loadConfig;
    start(): Promise<void>;
    trackPrepared(op: Operation): () => void;
    private resolveLine;
    private completeness;
    private rotate;
    private identityOf;
    private fingerprintOf;
    /** Resolve every configured line, then pick the first reachable complete one. */
    private selectActive;
    invalidateCredential(ref?: unknown): void;
    beginOperation(): Promise<Operation>;
    retainIdentity(identity: ConnectionIdentity): () => void;
    retainKey(key: string): () => void;
    isCurrent(gen: Generation): boolean;
    /** Synchronous admission guard for an irreversible write, not for prepared generation calls. */
    isOperationCurrent(op: Pick<Operation, 'gen' | 'connectionVersion'>): boolean;
    /**
     * Observe probe expiry and credential changes even without an update event. The newly resolved
     * operation is only a check: a write must still use the operation that authorised it, and check
     * isOperationCurrent again synchronously at dispatch after awaiting this method.
     */
    revalidateOperation(op: Operation): Promise<boolean>;
    redact(text: string): string;
    redactJson(value: unknown): unknown;
    formatErrorBody(text: string): string;
    syncCatalog(): Promise<void>;
    private syncGeneration;
    /** D6 owner admission + publish for one successfully mapped catalog (synchronous: no await between the checks and the effects). */
    private commitOwners;
    settings(body?: unknown): Promise<Response>;
    /** Structured line-list update: the only settings write path (BREAKING schema). */
    private updateLines;
    /**
     * Underlying cause of a failed settings write, for the 500 body. The thrower is the credentials
     * provider or the settings store, and its message is the only actionable part — e.g.
     * `credentials-local: … run "chmod 600 …"` for a hand-written, world-readable credentials file.
     * Redact every known secret AND the values this write tried to store (a provider may echo them),
     * then truncate: redacting after truncation can leave an unmatched secret prefix. A throwable that
     * cannot be stringified yields no cause — it must not turn the documented 500 into a 400.
     */
    private writeFailureCause;
    /** Sync only when the active identity changed (the caller may also ask for a resync). */
    private reconcileActiveLine;
    private retainedNow;
    private settingsView;
    /** Preference-only writes also persist the single clean schema (drops legacy fields). */
    savePreferences(patch: {
        visibleModels?: Record<string, string[]>;
        defaultEfforts?: Record<string, string>;
        sidebarUsage?: boolean;
        sidebarRefreshMinutes?: number;
        sidebarWindows?: SidebarWindowKind[];
    }): void;
    /**
     * Read-only draft check: one `GET /models` against the draft's own API root. It never writes
     * credentials or settings, never rotates the generation, never selects a line, never registers a
     * route and never touches the probe cache (see `magpie-line-selection`「线路检查端点与结果分类」).
     * The only await between admission and the request is credential resolution, and the connection
     * write version (bumped by every `updateLines` start and credential event) proves no write landed
     * in that window.
     */
    lineCheck(body: unknown): Promise<Response>;
    private elapsed;
    /** Redact first, then truncate: the reverse order can leave an unmatched secret prefix. */
    private trimReason;
    private checkReply;
    config(): LineSettings[];
    dispose(): Promise<void>;
}
