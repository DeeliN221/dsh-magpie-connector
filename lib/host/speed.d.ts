import type { CatalogModel } from './catalog.js';
export declare class SpeedController {
    private readonly fast;
    get(session: unknown, catalog?: CatalogModel[]): {
        tier: string;
        fastModels: string[];
    };
    set(session: unknown, tier: unknown): void;
    /** Call at stream time with prepareCall's captured model capabilities. */
    priority(session: string | undefined, model: CatalogModel): 'priority' | undefined;
}
