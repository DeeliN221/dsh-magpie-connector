import type { MagpieRuntime } from './runtime.js';
import { CardsController } from './cards.js';
import { ResetController } from './reset.js';
import { SpeedController } from './speed.js';
import { LatencyController } from './latency.js';
export declare class SettingsController {
    readonly runtime: MagpieRuntime;
    private pending;
    constructor(runtime: MagpieRuntime);
    handle(body?: unknown): Promise<Response>;
    private execute;
}
export interface FetchRegistration {
    path: string;
    methods: ('GET' | 'POST')[];
    requestBody: 'buffered';
    fetch: (request: Request) => Promise<Response>;
}
export interface FetchRegistry {
    register(route: FetchRegistration): () => void;
}
/** Register on the injected connection.fetch; caller owns the returned disposer. */
export declare function registerRoutes(fetch: FetchRegistry, runtime: MagpieRuntime, speed?: SpeedController, cards?: CardsController, latency?: LatencyController, reset?: ResetController): {
    settings: SettingsController;
    cards: CardsController;
    speed: SpeedController;
    latency: LatencyController;
    reset: ResetController;
    dispose: () => void;
};
