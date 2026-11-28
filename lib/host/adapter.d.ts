import { LlmAdapter, type GenerateOptions, type LlmFailure, type PreparedAdapterCall, type StreamChunk, type TokenUsage } from '@deepseek-ai/dsh-llm';
import type { AttachmentStore } from '@deepseek-ai/dsh-attachment';
import { type Usage } from '@earendil-works/pi-ai';
import type { MagpieRuntime } from './runtime.js';
/** Any byte from the gateway (headers, SSE events, heartbeats) proves liveness; only silence this long times out. */
export declare const STREAM_IDLE_TIMEOUT_MS = 300000;
/**
 * Same shape as dsh-plugin-subscriptions: Magpie fronts subscription upstreams
 * that shed load in bursts, so ten retries from 1s doubling to 60s with 20%
 * jitter. DSH's llm-retry plugin executes it for the canonical retryable codes.
 */
export declare const RETRY_POLICY: import("@deepseek-ai/dsh-llm").ResolvedRetryPolicy;
type HttpFailure = {
    status: number;
    retryAfterMs?: number;
};
/** Map a gateway failure onto the provider-neutral codes DSH's retry policy routes on. */
export declare function classifyFailure(message: string, http?: HttpFailure): LlmFailure;
export declare function mapUsage(u: Usage): TokenUsage;
export declare class MagpieAdapter extends LlmAdapter {
    readonly runtime: MagpieRuntime;
    readonly attachments?: Pick<AttachmentStore, "readImage" | "imageHostPath"> | undefined;
    readonly isFast: (_session: string) => boolean;
    constructor(runtime: MagpieRuntime, attachments?: Pick<AttachmentStore, "readImage" | "imageHostPath"> | undefined, isFast?: (_session: string) => boolean);
    providerInfo(route: string): {
        id: string;
        name: string;
    };
    providerRetryPolicy(): import("@deepseek-ai/dsh-llm").ResolvedRetryPolicy;
    /** Look the model up by id in the whole catalog (route-independent); the returned provider is the requested route. */
    private entryFor;
    listModels(route: string): Promise<{
        provider: string;
        context?: import("@deepseek-ai/dsh-llm").LlmModelContext;
        defaultMaxTokens?: number;
        reasoning?: import("@deepseek-ai/dsh-llm").LlmModelReasoningInfo;
        systemPromptUpdate?: import("@deepseek-ai/dsh-llm").SystemPromptUpdate;
        toolUpdate?: import("@deepseek-ai/dsh-llm").ToolUpdate;
        id: string;
        name: string;
        description?: string;
        inputModalities?: readonly import("@deepseek-ai/dsh-llm").ModelModality[];
        badge?: import("@deepseek-ai/dsh-llm").LlmModelBadge;
    }[]>;
    resolveModel(route: string, id: string): Promise<import("@deepseek-ai/dsh-llm").LlmResolvedModelInfo>;
    prepareCall(route: string, id: string, signal?: AbortSignal): Promise<PreparedAdapterCall>;
    private failure;
    stream(options: GenerateOptions): AsyncIterable<StreamChunk>;
    private context;
    private dispatch;
}
export {};
