import type { CatalogModel } from './catalog.js';
export declare function validateVisibility(value: unknown): Record<string, string[]>;
export declare function isVisible(model: CatalogModel, saved: Record<string, string[]>): boolean;
export declare function visibleCatalog(models: CatalogModel[], saved: Record<string, string[]>): CatalogModel[];
