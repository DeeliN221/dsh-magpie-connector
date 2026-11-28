/**
 * The only way the web half reaches the host: the four D10 resources under
 * `/api/dsh-magpie-connector/`. Responses are bare JSON; errors are non-2xx with
 * `{error: string}`. Injected so tests replace it without touching `fetch`.
 */
export type Resource = 'settings' | 'cards' | 'speed' | 'line-check' | 'latency' | 'reset';
export interface ApiRequest {
    method: 'GET' | 'POST';
    path: Resource;
    query?: Record<string, string>;
    body?: unknown;
}
export interface ApiResponse {
    status: number;
    body: unknown;
}
export type Api = (request: ApiRequest) => Promise<ApiResponse>;
export declare function createFetchApi(base?: string): Api;
export declare const isOk: (response: ApiResponse) => boolean;
/** Error text of a failed response: the host's (already redacted) reason plus the status. */
export declare function failureText(response: ApiResponse): string;
export declare const errorText: (error: unknown) => string;
