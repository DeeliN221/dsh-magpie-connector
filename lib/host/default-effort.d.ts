import type { CatalogModel } from './catalog.js';
export declare function updateDefaultEffort(saved: Record<string, string>, input: unknown, catalog: CatalogModel[]): Record<string, string>;
export declare function withDefaultEffort(model: CatalogModel, saved: Record<string, string>): CatalogModel['info'];
