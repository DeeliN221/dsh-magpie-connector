import type { Context } from '@deepseek-ai/cordis';
import { MagpieRuntime } from './host/runtime.js';
import { MagpieAdapter } from './host/adapter.js';
import { type RouteRegistrar } from './host/registrar.js';
export { MagpieRuntime, lineCredentialRefs, lineIdOfCredentialRef } from './host/runtime.js';
export { MagpieAdapter, mapUsage } from './host/adapter.js';
export { SettingsStore } from './host/settings.js';
export { GatewayTransport } from './host/transport.js';
export { createRouteRegistrar, type RouteRegistrar, type PublishResult } from './host/registrar.js';
export { TRANSPORT_ID, ownerKey, ownerLabel, routeOf, isMagpieRoute } from './host/catalog.js';
export declare const name = "dsh-magpie-connector";
export declare const inject: string[];
export interface Config {
    home?: string;
}
export declare function apply(ctx: Context, config?: Config): {
    runtime: MagpieRuntime;
    adapter: MagpieAdapter;
    routes: RouteRegistrar;
};
