export function updateDefaultEffort(saved, input, catalog) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !['model', 'effort'].includes(k)))
        throw new Error('Invalid defaultEffort');
    const { model, effort } = input;
    if (typeof model !== 'string' || !model || (effort !== null && (typeof effort !== 'string' || !catalog.find(m => m.info.id === model)?.efforts.includes(effort))))
        throw new Error('Invalid default effort');
    const next = { ...saved };
    if (effort === null)
        delete next[model];
    else
        next[model] = effort;
    return next;
}
export function withDefaultEffort(model, saved) {
    const info = { ...model.info };
    if (info.reasoning) {
        const { defaultEffort: _ignored, ...reasoning } = info.reasoning;
        const effort = Object.hasOwn(saved, model.info.id) ? saved[model.info.id] : undefined;
        info.reasoning = { ...reasoning, ...(effort !== undefined && model.efforts.includes(effort) ? { defaultEffort: effort } : {}) };
    }
    return info;
}
