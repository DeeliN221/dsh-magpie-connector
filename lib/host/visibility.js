export function validateVisibility(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.values(value).some(ids => !Array.isArray(ids) || ids.some(id => typeof id !== 'string')))
        throw new Error('Invalid visibleModels');
    return Object.fromEntries(Object.entries(value).map(([provider, ids]) => [provider, [...ids]]));
}
export function isVisible(model, saved) {
    return !Object.hasOwn(saved, model.provider) || saved[model.provider].includes(model.info.id);
}
export function visibleCatalog(models, saved) { return models.filter(m => isVisible(m, saved)); }
