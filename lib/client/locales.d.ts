/**
 * Copy dictionaries for the Magpie settings page and its usage/speed controls.
 *
 * The plugin deliberately avoids `dsh-client-*` type packages (its settings UI is
 * plain `h()` over a hand-rolled context), so this file carries both the
 * dictionaries and the module-scoped translator instead of importing the shared
 * LocaleNamespaceMap base. `apply()` binds the real `ctx.locale.bind(NS)`
 * translator once; before that (unit tests, any embedding without a locale
 * service) the module falls back to the Chinese reference set, so behaviour is
 * unchanged for existing tests and for a host that never provides `locale`.
 *
 * Placeholders use the host's `{name}` syntax; interpolation happens here so the
 * fallback path and the bound path behave identically.
 *
 * @module dsh-magpie-connector/client/locales
 */
/** The locale namespace this plugin owns. */
export declare const NS = "settings.magpie";
/** English strings (reference key set; values may contain `{placeholders}`). */
export declare const en: {
    intro: string;
    settingsReadFailed: string;
    readingSettings: string;
    usageReading: string;
    usageForbidden: string;
    usageUnconfigured: string;
    usageError: string;
    usageEmpty: string;
    restrictedHint: string;
    notReread: string;
    rereading: string;
    usageLabel: string;
    fetchModelsAndUsage: string;
    envKeyReadonly: string;
    notSaved: string;
    refreshFailed: string;
    refreshModels: string;
    modelsRefreshed: string;
    save: string;
    cancel: string;
    saving: string;
    addLine: string;
    addBackupLine: string;
    connection: string;
    infoText: string;
    hostnameUnset: string;
    savedLine: string;
    savedNoActive: string;
    noLines: string;
    lineIndex: string;
    currentLine: string;
    unsaved: string;
    unconfigured: string;
    configured: string;
    notConfigured: string;
    readonlyFromEnv: string;
    baseUrlLabel: string;
    apiKeyLabel: string;
    keepBlank: string;
    required: string;
    checkLine: string;
    checking: string;
    clear: string;
    checkReadonly: string;
    checkUnparsable: string;
    checkFailed: string;
    checkUnsupported: string;
    checkModelCount: string;
    checkMatchesCache: string;
    checkMatchesCacheAt: string;
    checkDiffCounts: string;
    listSeparator: string;
    cloudflareAccess: string;
    modelIds: string;
    diffAdded: string;
    diffRemoved: string;
    advanced: string;
    accessMode: string;
    direct: string;
    accessReadonly: string;
    directHintClears: string;
    directHint: string;
    accessFieldLabel: string;
    cloudflareHint: string;
    modelsCount: string;
    syncFailed: string;
    syncFailedKind: string;
    routeRegistrationFailed: string;
    ownersReset: string;
    ownerLimitReached: string;
    followCatalog: string;
    visibilityFollow: string;
    visibilityManual: string;
    showInPicker: string;
    defaultEffortAria: string;
    defaultEffortNone: string;
    routingGroupsTitle: string;
    routingGroupsHint: string;
    routingKindCustom: string;
    routingKindAuto: string;
    effortStale: string;
    latencyMeasuring: string;
    latencyTimeout: string;
    latencyTitle: string;
    latencyTitleTimeout: string;
    moveUp: string;
    moveDown: string;
    remove: string;
    lineAction: string;
    lineActionReason: string;
    firstLine: string;
    lastLine: string;
    onlyLine: string;
    checkKindOk: string;
    checkKindUnauthorized: string;
    checkKindForbidden: string;
    checkKindHttp: string;
    checkKindRedirect: string;
    checkKindUnreachable: string;
    checkKindTimeout: string;
    checkKindInvalidCatalog: string;
    checkKindIncomplete: string;
    checkKindInvalid: string;
    checkKindBusy: string;
    checkKindPending: string;
    syncKindUnauthorized: string;
    syncKindForbidden: string;
    syncKindHttp: string;
    syncKindUnreachable: string;
    syncKindSettings: string;
    syncKindRegistration: string;
    usageUser: string;
    usagePlan: string;
    usageUntil: string;
    usageRenew: string;
    usageBalance: string;
    usageReadAt: string;
    usageReadAtStale: string;
    usageResetAt: string;
    refresh: string;
    resetCountLineOne: string;
    resetCountLineMany: string;
    resetCreditsTitle: string;
    resetCreditsAvailable: string;
    resetCreditFull: string;
    resetCreditExpires: string;
    resetCreditExpiryUnknown: string;
    resetFiveHour: string;
    resetWeekly: string;
    resetWindowFiveHour: string;
    resetWindowWeekly: string;
    resetExpired: string;
    resetInHours: string;
    resetInDays: string;
    resetUseButton: string;
    resetUseChecking: string;
    resetUseConfirming: string;
    resetUseGuard: string;
    resetUseRefresh: string;
    resetUseRestart: string;
    resetUseReady: string;
    resetUseConfirmTitle: string;
    resetUseWarning: string;
    resetUseAcknowledge: string;
    resetUseConfirm: string;
    resetUseSuccess: string;
    resetUseKept: string;
    resetUseNoCredit: string;
    resetUseAlready: string;
    resetUseUnknown: string;
    resetUseUnconsumed: string;
    resetUseUncertain: string;
    resetUseBusy: string;
    resetUseTicketInvalid: string;
    resetUseTicketExpired: string;
    resetUseUnavailable: string;
    resetUseReadFailed: string;
    resetUseAccount: string;
    resetUseWeekly: string;
    resetUseResetCode: string;
    yes: string;
    no: string;
    unlimited: string;
    sidebarTitle: string;
    sidebarAccountCount: string;
    sidebarAccountN: string;
    sidebarPanelTitle: string;
    sidebarToggle: string;
    sidebarToggleHint: string;
    sidebarWindowLabel: string;
    sidebarWindowWeekly: string;
    sidebarWindowFiveHour: string;
    sidebarWindowMonthly: string;
    sidebarWindowsHint: string;
    sidebarWindowAtLeastOne: string;
    sidebarResetUnknown: string;
    sidebarWindowFallbackTitle: string;
    sidebarExpand: string;
    sidebarCollapse: string;
    sidebarRefreshLabel: string;
    sidebarRefreshUnit: string;
    sidebarRefreshHint: string;
    sidebarJustNow: string;
    sidebarMinutesAgo: string;
    sidebarHoursAgo: string;
    sidebarDaysAgo: string;
    usageReadingFailed: string;
    speedTierStandard: string;
    speedTierStandardDescription: string;
    speedTierFast: string;
    speedTierFastDescription: string;
    speedLabel: string;
    speedSaveFailed: string;
    speedMenu: string;
};
/** The key union, derived from the English reference set. */
export type MagpieKey = keyof typeof en;
/** Simplified Chinese strings; the reference implementation this plugin shipped with. */
export declare const zh: Record<MagpieKey, string>;
type Params = Record<string, string | number>;
type Translator = (key: MagpieKey) => string;
/** Bind the host translator. Called once from the client entry (`apply`). */
export declare function bindLocale(translator: Translator): void;
/** Drop the bound translator and fall back to the Chinese reference set (tests). */
export declare function resetLocale(): void;
/** Interpolate `{name}` placeholders; unknown names stay verbatim. */
export declare function interpolate(template: string, params?: Params): string;
/**
 * Translate one key. Without a bound translator the Chinese reference set is
 * used, so unit tests and any embedding without a locale service keep the copy
 * this plugin shipped with.
 */
export declare function t(key: MagpieKey, params?: Params): string;
export {};
