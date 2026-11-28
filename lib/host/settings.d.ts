import type { SidebarWindowKind } from '../shared/sidebar-window.js';
export type AccessMode = 'direct' | 'cloudflare';
export type CredentialField = 'key' | 'accessClientId' | 'accessClientSecret';
/** One configured Magpie ingress line: address + its own credentials binding. */
export interface LineSettings {
    id: string;
    baseUrl: string;
    accessMode: AccessMode;
}
/** A credential write that may have been attempted by a settings write. */
export interface PendingCredential {
    lineId: string;
    field: CredentialField;
}
/**
 * Single settings schema (BREAKING, no legacy fields): an ordered line list,
 * display preferences and the restart-safe credential-write quarantine.
 */
export interface Settings {
    lines: LineSettings[];
    visibleModels: Record<string, string[]>;
    defaultEfforts: Record<string, string>;
    credentialUpdatePending?: PendingCredential[];
    /** Owner keys seen so far (first-seen order, max {@link MAX_OWNERS}); each owns one registered LLM route. */
    knownOwners?: string[];
    /** Sidebar usage card preference (host-persisted; absent means false). */
    sidebarUsage?: boolean;
    /** Sidebar card auto-refresh interval in whole minutes; 0 disables, absent = 5. */
    sidebarRefreshMinutes?: number;
    /** Gateway windows the sidebar card lists, canonically ordered; absent = `['weekly']`. */
    sidebarWindows?: SidebarWindowKind[];
    /** 0.6.7 legacy single tier; read once for migration, never written. */
    sidebarWindow?: unknown;
}
export declare class SettingsStore {
    readonly path?: string | undefined;
    value: Settings;
    constructor(path?: string | undefined);
    save(value: Settings): void;
}
export declare function normalizeBaseUrl(value: unknown): string;
export declare const MAX_LINES = 5;
export declare const MAX_OWNERS = 32;
export declare const LINE_ID_PATTERN: RegExp;
export declare const isAccessMode: (value: unknown) => value is AccessMode;
export declare const isCredentialField: (value: unknown) => value is CredentialField;
/** Normalize one persisted line entry; malformed entries are rejected, not guessed. */
export declare function normalizeLineSettings(value: unknown): LineSettings;
/**
 * Strict load-time validation for the persisted connection. Any violation makes
 * the whole connection read as empty (the caller never sends a request with a
 * partially trusted list); the stored file is left untouched.
 */
export declare function validateLoadedLines(value: unknown): LineSettings[];
export declare function validatePendingCredentials(value: unknown): PendingCredential[];
/** Host-generated opaque stable line id: 8 lowercase hex, unique within the supplied set. */
export declare function randomLineId(existing: Iterable<string>): string;
/**
 * Load-time check of `knownOwners`: missing = empty; anything else invalid (not an array, bad key,
 * duplicate, more than {@link MAX_OWNERS}) throws so the caller resets the WHOLE array (no partial repair).
 */
export declare function validateKnownOwners(value: unknown): string[];
