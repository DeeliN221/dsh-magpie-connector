import { LlmAdapter, resolveRetryPolicy, isContextWindowExceededError, isQuotaExceededError, CONTEXT_WINDOW_EXCEEDED_CODE, QUOTA_EXCEEDED_CODE, EMPTY_RESPONSE_CODE } from '@deepseek-ai/dsh-llm';
import { createHash } from 'node:crypto';
import { createProvider } from '@earendil-works/pi-ai';
import { normalizeContext } from '@earendil-works/pi-ai/utils/transcript';
import * as chat from '@earendil-works/pi-ai/api/openai-completions';
import * as responses from '@earendil-works/pi-ai/api/openai-responses';
import { TRANSPORT_ID, isMagpieRoute, ownerLabel, ownerOfRoute } from './catalog.js';
import { visibleCatalog } from './visibility.js';
import { withDefaultEffort } from './default-effort.js';
const provider = createProvider({ id: TRANSPORT_ID, auth: { apiKey: { name: 'Gateway key', resolve: async () => undefined } }, models: [], api: { 'openai-completions': chat, 'openai-responses': responses } });
const emptyUsage = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } });
const record = (value) => typeof value === 'object' && value !== null && !Array.isArray(value) ? value : undefined;
const blockHash = (block) => createHash('sha256').update(JSON.stringify(block.type === 'text' || block.type === 'reasoning' ? [block.type, block.text] : block.type === 'tool-call' ? [block.type, block.id, block.name, block.arguments] : [block.type])).digest('hex');
function parseArguments(raw) {
    try {
        return (record(JSON.parse(raw)) ?? {});
    }
    catch {
        return {};
    }
}
// Like dsh-llm-pi-ai: only block-aligned native metadata, never a second copy of content.
function replayState(message, requestedModel, args) {
    return {
        response: { kind: 'dsh-magpie-connector-pi', version: 1, api: message.api, provider: message.provider, model: requestedModel, stopReason: message.stopReason,
            ...(message.responseId !== undefined ? { responseId: message.responseId } : {}), ...(message.responseModel !== undefined ? { responseModel: message.responseModel } : {}), ...(message.providerThinkingLevel !== undefined ? { providerThinkingLevel: message.providerThinkingLevel } : {}) },
        blocks: message.content.map((block, index) => {
            if (block.type === 'text')
                return { type: 'text', hash: blockHash({ type: 'text', text: block.text }), ...(block.textSignature !== undefined ? { textSignature: block.textSignature } : {}) };
            if (block.type === 'thinking')
                return { type: 'reasoning', hash: blockHash({ type: 'reasoning', text: block.thinking }), ...(block.thinkingSignature !== undefined ? { thinkingSignature: block.thinkingSignature } : {}), ...(block.redacted !== undefined ? { redacted: block.redacted } : {}) };
            return { type: 'tool-call', hash: blockHash({ type: 'tool-call', id: block.id, name: block.name, arguments: args.get(index) ?? JSON.stringify(block.arguments) }), ...(block.thoughtSignature !== undefined ? { thoughtSignature: block.thoughtSignature } : {}), ...(block.namespace !== undefined ? { namespace: block.namespace } : {}) };
        }),
    };
}
function restoreAssistant(message, model) {
    const content = message.content.flatMap((block) => {
        if (block.type === 'text')
            return [{ type: 'text', text: block.text }];
        if (block.type === 'reasoning')
            return [{ type: 'thinking', thinking: block.text }];
        if (block.type === 'tool-call')
            return [{ type: 'toolCall', id: block.id, name: block.name, arguments: parseArguments(block.arguments) }];
        return [];
    });
    // Native replay identity is the fixed transport id, shared by every owner route; only our own routes may claim it.
    const ours = isMagpieRoute(message.source.provider);
    // Same-model tool ids already belong to DSH content, even when no replay was stored.
    const fallback = { role: 'assistant', api: ours && message.source.model === model.id ? model.api : 'dsh-foreign', provider: ours ? TRANSPORT_ID : message.source.provider, model: message.source.model, content: content.map(block => block.type === 'thinking' ? { type: 'text', text: block.thinking } : block), usage: emptyUsage(), stopReason: content.some(block => block.type === 'toolCall') ? 'toolUse' : 'stop', timestamp: 0 };
    const envelope = record(message.source.replayState), response = record(envelope?.response), blocks = envelope?.blocks;
    if (!ours || response?.kind !== 'dsh-magpie-connector-pi' || response.version !== 1 || typeof response.api !== 'string' || !response.api || response.provider !== TRANSPORT_ID || response.model !== message.source.model || !['stop', 'length', 'toolUse'].includes(String(response.stopReason)) || !Array.isArray(blocks) || blocks.length !== message.content.length)
        return fallback;
    for (const key of ['responseId', 'responseModel', 'providerThinkingLevel'])
        if (response[key] !== undefined && typeof response[key] !== 'string')
            return fallback;
    const metadata = blocks.map(record);
    for (const [index, block] of message.content.entries()) {
        const meta = metadata[index];
        // A reasoning signature may contain old summary text; edits must invalidate it too.
        if (!meta || !['text', 'reasoning', 'tool-call'].includes(block.type) || meta.type !== block.type || meta.hash !== blockHash(block))
            return fallback;
        for (const key of ['textSignature', 'thinkingSignature', 'thoughtSignature', 'namespace'])
            if (meta[key] !== undefined && typeof meta[key] !== 'string')
                return fallback;
        if (meta.redacted !== undefined && typeof meta.redacted !== 'boolean')
            return fallback;
    }
    return { ...fallback, api: response.api, stopReason: response.stopReason,
        ...(typeof response.responseId === 'string' ? { responseId: response.responseId } : {}), ...(typeof response.responseModel === 'string' ? { responseModel: response.responseModel } : {}), ...(typeof response.providerThinkingLevel === 'string' ? { providerThinkingLevel: response.providerThinkingLevel } : {}),
        content: content.map((block, index) => {
            const meta = metadata[index];
            if (block.type === 'text')
                return { ...block, ...(typeof meta.textSignature === 'string' ? { textSignature: meta.textSignature } : {}) };
            if (block.type === 'thinking')
                return { ...block, ...(typeof meta.thinkingSignature === 'string' ? { thinkingSignature: meta.thinkingSignature } : {}), ...(typeof meta.redacted === 'boolean' ? { redacted: meta.redacted } : {}) };
            return { ...block, ...(typeof meta.thoughtSignature === 'string' ? { thoughtSignature: meta.thoughtSignature } : {}), ...(typeof meta.namespace === 'string' ? { namespace: meta.namespace } : {}) };
        }) };
}
/** Any byte from the gateway (headers, SSE events, heartbeats) proves liveness; only silence this long times out. */
export const STREAM_IDLE_TIMEOUT_MS = 300_000;
/**
 * Same shape as dsh-plugin-subscriptions: Magpie fronts subscription upstreams
 * that shed load in bursts, so ten retries from 1s doubling to 60s with 20%
 * jitter. DSH's llm-retry plugin executes it for the canonical retryable codes.
 */
export const RETRY_POLICY = resolveRetryPolicy({ mode: 'normal', maxRetries: 10, backoff: { initialDelayMs: 1000, maxDelayMs: 60_000, jitterRatio: 0.2 } }, 'dsh-magpie-connector retryPolicy');
function retryAfterMs(response) {
    const raw = response.headers.get('retry-after')?.trim();
    if (!raw)
        return undefined;
    const seconds = Number(raw);
    const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(raw) - Date.now();
    return Number.isFinite(ms) && ms > 0 ? ms : undefined;
}
/** Map a gateway failure onto the provider-neutral codes DSH's retry policy routes on. */
export function classifyFailure(message, http) {
    const status = http?.status;
    const extra = { ...(status !== undefined ? { status } : {}), ...(http?.retryAfterMs !== undefined ? { providerRetryAfterMs: http.retryAfterMs } : {}) };
    let code;
    if (status === 401 || status === 403)
        code = 'AUTH';
    else if (status === 429)
        code = 'RATE_LIMIT';
    else if (isContextWindowExceededError(message))
        code = CONTEXT_WINDOW_EXCEEDED_CODE;
    else if (isQuotaExceededError(message))
        code = QUOTA_EXCEEDED_CODE;
    else if (status === 408 || status === 504)
        code = 'TIMEOUT';
    else if (status !== undefined && status >= 500)
        code = 'SERVER';
    else if (status !== undefined)
        code = `HTTP_${status}`;
    else if (message === 'MAGPIE_STREAM_TRUNCATED')
        code = 'TRANSPORT';
    else if (message.startsWith('MAGPIE_'))
        code = message;
    else if (/\b5\d\d\b|server_error|overloaded|internal server error/i.test(message))
        code = 'SERVER';
    else if (/\btimed?\s*out\b|timeout/i.test(message))
        code = 'TIMEOUT';
    else if (/\b(?:network|connection|socket|fetch)\b|\bECONN[A-Z]+\b|other side closed|terminated|premature close|stream ended (?:before|without)/i.test(message))
        code = 'TRANSPORT';
    else
        code = 'MAGPIE_GENERATION_FAILED';
    return { code, message, ...extra };
}
export function mapUsage(u) {
    return { inputTokens: u.input, outputTokens: u.output, ...(u.cacheRead > 0 ? { cacheReadTokens: u.cacheRead } : {}), ...(u.cacheWrite > 0 ? { cacheWriteTokens: u.cacheWrite } : {}), ...(u.input > 0 ? { totalTokens: u.input + u.cacheRead + u.cacheWrite + u.output } : {}) };
}
export class MagpieAdapter extends LlmAdapter {
    runtime;
    attachments;
    isFast;
    constructor(runtime, attachments, isFast = (_session) => false) {
        super();
        this.runtime = runtime;
        this.attachments = attachments;
        this.isFast = isFast;
    }
    providerInfo(route) { return { id: route, name: ownerLabel(ownerOfRoute(route)) }; }
    providerRetryPolicy() { return RETRY_POLICY; }
    /** Look the model up by id in the whole catalog (route-independent); the returned provider is the requested route. */
    entryFor(op, route, id) {
        const entry = structuredClone(op.gen.catalog.find(m => m.info.id === id) ?? { info: { provider: route, id, name: id, inputModalities: ['text'] }, provider: id.split('/')[0], owner: ownerOfRoute(route), efforts: [], nativeEndpoints: [], serviceTiers: [] });
        entry.info = { ...withDefaultEffort(entry, this.runtime.store.value.defaultEfforts), provider: route };
        return entry;
    }
    async listModels(route) {
        const op = await this.runtime.beginOperation();
        try {
            const owner = ownerOfRoute(route);
            return visibleCatalog(op.gen.catalog.filter(m => this.runtime.ownerOf(m) === owner), this.runtime.store.value.visibleModels).map(m => ({ ...structuredClone(withDefaultEffort(m, this.runtime.store.value.defaultEfforts)), provider: route }));
        }
        finally {
            op.release();
        }
    }
    async resolveModel(route, id) {
        const op = await this.runtime.beginOperation();
        try {
            return this.entryFor(op, route, id).info;
        }
        finally {
            op.release();
        }
    }
    async prepareCall(route, id, signal) {
        const op = await this.runtime.beginOperation();
        const entry = this.entryFor(op, route, id);
        // Prepared objects may be abandoned by SDK validation; retain only while dispatched.
        op.release();
        const untrack = this.runtime.trackPrepared(op);
        signal?.addEventListener('abort', untrack, { once: true });
        if (signal?.aborted)
            untrack();
        let used = false;
        return { model: structuredClone(entry.info), stream: options => {
                if (used)
                    return this.failure('INVALID_PREPARED_CALL');
                used = true;
                const capturedOptions = signal ? { ...options, signal: AbortSignal.any([signal, ...(options.signal ? [options.signal] : [])]) } : options;
                return this.dispatch(op, entry, capturedOptions, () => { untrack(); signal?.removeEventListener('abort', untrack); });
            } };
    }
    async *failure(message) { yield { type: 'finish', reason: { kind: 'error', failure: classifyFailure(message) } }; }
    async *stream(options) {
        try {
            const prepared = await this.prepareCall(options.provider, options.model);
            yield* prepared.stream(options);
        }
        catch (error) {
            yield* this.failure(this.runtime.redact(error instanceof Error ? error.message : String(error)));
        }
    }
    async context(options, model) {
        const messages = [];
        for (const message of options.messages) {
            if (message.role === 'system' || message.role === 'developer') {
                messages.push({ role: 'system', content: message.content.flatMap(b => b.type === 'text' ? [b.text] : []).join('\n'), timestamp: 0 });
                continue;
            }
            if (message.role === 'assistant') {
                messages.push(restoreAssistant(message, model));
                continue;
            }
            const content = [];
            for (const block of message.content) {
                if (block.type === 'text')
                    content.push({ type: 'text', text: block.text });
                else if (block.type === 'image') {
                    if (block.offloaded) {
                        content.push({ type: 'text', text: `[Image ${block.attachment.name ?? block.attachment.attachmentId} offloaded: ${this.attachments?.imageHostPath(block.attachment) ?? 'unavailable'}]` });
                        continue;
                    }
                    if (!model.input.includes('image'))
                        throw new Error('MAGPIE_IMAGE_UNSUPPORTED');
                    if (!this.attachments)
                        throw new Error('MAGPIE_ATTACHMENT_UNAVAILABLE');
                    const image = await this.attachments.readImage(block.attachment, options.signal);
                    content.push({ type: 'image', mimeType: image.ref.mediaType, data: Buffer.from(image.data).toString('base64') });
                }
            }
            if (message.role === 'tool')
                messages.push({ role: 'toolResult', toolCallId: message.toolCallId, toolName: '', content, isError: message.isError ?? false, timestamp: 0 });
            else
                messages.push({ role: 'user', content, timestamp: 0 });
        }
        return normalizeContext({ messages, ...(options.system ? { systemPrompt: options.system } : {}), ...(options.tools ? { tools: options.tools } : {}) });
    }
    async *dispatch(op, entry, options, untrack = () => { }) {
        const releaseKey = this.runtime.retainIdentity(op);
        const controller = new AbortController();
        const signal = AbortSignal.any([controller.signal, this.runtime.transport.signal.signal, ...(options.signal ? [options.signal] : [])]);
        let timer, timedOut = false, http;
        const arm = () => { clearTimeout(timer); timer = setTimeout(() => { timedOut = true; controller.abort(); }, STREAM_IDLE_TIMEOUT_MS); };
        const timeout = () => ({ code: 'TIMEOUT', message: `MAGPIE_STREAM_TIMEOUT: no data from the gateway for ${STREAM_IDLE_TIMEOUT_MS / 1000}s` });
        try {
            if (!op.key || !op.baseUrl)
                throw new Error('MAGPIE_NOT_CONFIGURED');
            if (options.stop?.length)
                throw new Error('MAGPIE_STOP_UNSUPPORTED');
            const api = entry.nativeEndpoints.includes('/v1/responses') ? 'openai-responses' : 'openai-completions';
            const model = { id: entry.info.id, name: entry.info.name, provider: TRANSPORT_ID, api, baseUrl: op.baseUrl, reasoning: entry.efforts.length > 0, thinkingLevelMap: { off: null, ...Object.fromEntries(entry.efforts.map(e => [e, e])) }, input: entry.info.inputModalities?.includes('image') ? ['text', 'image'] : ['text'], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: entry.info.context?.contextWindow ?? 128000, maxTokens: entry.outputLimit ?? 16384,
                compat: { supportsFinishReason: true, thinkingFormat: 'openai', maxTokensField: 'max_completion_tokens', ...(api === 'openai-responses' ? { supportsStrictMode: true } : {}) } };
            const context = await this.context(options, model);
            const fast = !!options.sessionId && this.isFast(options.sessionId) && entry.serviceTiers.includes('priority');
            arm();
            const gatewayFetch = this.runtime.transport.fetchFor(op);
            // One attempt per call: DSH's llm-retry owns retries (see RETRY_POLICY), so nothing is replayed here.
            const watchedFetch = async (input, init) => {
                const response = await gatewayFetch(input, init);
                arm();
                if (!response.ok) {
                    http = { status: response.status, ...(retryAfterMs(response) !== undefined ? { retryAfterMs: retryAfterMs(response) } : {}) };
                    return response;
                }
                if (!response.body)
                    return response;
                const body = response.body.pipeThrough(new TransformStream({ transform(chunk, out) { arm(); out.enqueue(chunk); } }));
                return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
            };
            const events = provider.stream(model, context, { apiKey: op.key, fetch: watchedFetch, signal, maxRetries: 0,
                ...(options.maxTokens !== undefined ? { maxTokens: options.maxTokens } : {}), ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
                ...(options.reasoningEffort ? { reasoningEffort: options.reasoningEffort } : {}), ...(options.sessionId ? { sessionId: options.sessionId } : {}), ...(fast ? { serviceTier: 'priority', onPayload: (payload) => { payload.service_tier = 'priority'; } } : {}),
            });
            const args = new Map();
            for await (const event of events) {
                if (event.type === 'text_start' || event.type === 'thinking_start' || event.type === 'toolcall_start')
                    yield { type: 'block-start', index: event.contentIndex, blockType: event.type === 'text_start' ? 'text' : event.type === 'thinking_start' ? 'reasoning' : 'tool-call' };
                else if (event.type === 'text_delta')
                    yield { type: 'text-delta', index: event.contentIndex, text: event.delta };
                else if (event.type === 'thinking_delta')
                    yield { type: 'reasoning-delta', index: event.contentIndex, text: event.delta };
                else if (event.type === 'toolcall_delta') {
                    args.set(event.contentIndex, (args.get(event.contentIndex) ?? '') + event.delta);
                    const tool = event.partial.content[event.contentIndex];
                    if (tool?.type === 'toolCall')
                        yield { type: 'tool-call-delta', index: event.contentIndex, id: tool.id, name: tool.name, argumentsDelta: event.delta };
                }
                else if (event.type === 'text_end' || event.type === 'thinking_end')
                    yield { type: 'block-end', index: event.contentIndex, block: event.type === 'text_end' ? { type: 'text', text: event.content } : { type: 'reasoning', text: event.content } };
                else if (event.type === 'toolcall_end')
                    yield { type: 'block-end', index: event.contentIndex, block: { type: 'tool-call', id: event.toolCall.id, name: event.toolCall.name, arguments: args.get(event.contentIndex) ?? JSON.stringify(event.toolCall.arguments) } };
                else if (event.type === 'done') {
                    yield { type: 'usage', usage: mapUsage(event.message.usage) };
                    // A clean stop with nothing in it would silently end the turn; report it so DSH can retry.
                    if (event.reason === 'stop' && event.message.content.length === 0) {
                        yield { type: 'finish', reason: { kind: 'error', failure: { code: EMPTY_RESPONSE_CODE, message: 'MAGPIE_EMPTY_RESPONSE' } } };
                        return;
                    }
                    yield { type: 'finish', reason: { kind: event.reason === 'length' ? 'max-tokens' : event.reason === 'toolUse' ? 'tool-calls' : 'stop' }, replayState: replayState(event.message, entry.info.id, args) };
                    return;
                }
                else if (event.type === 'error') {
                    yield { type: 'usage', usage: mapUsage(event.error.usage) };
                    const message = this.runtime.redact(event.error.errorMessage ?? 'MAGPIE_GENERATION_FAILED');
                    if (signal.aborted && !timedOut) {
                        yield { type: 'finish', reason: { kind: 'aborted', failure: { code: 'ABORTED', message } } };
                        return;
                    }
                    yield { type: 'finish', reason: { kind: 'error', failure: timedOut ? timeout() : classifyFailure(message, http) } };
                    return;
                }
            }
            throw new Error('MAGPIE_STREAM_TRUNCATED');
        }
        catch (error) {
            const message = this.runtime.redact(error instanceof Error ? error.message : String(error));
            if (signal.aborted && !timedOut) {
                yield { type: 'finish', reason: { kind: 'aborted', failure: { code: 'ABORTED', message } } };
                return;
            }
            yield { type: 'finish', reason: { kind: 'error', failure: timedOut ? timeout() : classifyFailure(message, http) } };
        }
        finally {
            clearTimeout(timer);
            controller.abort();
            releaseKey();
            untrack();
            op.release();
        }
    }
}
