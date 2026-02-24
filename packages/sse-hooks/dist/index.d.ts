declare enum ReadyState {
    Connecting = 0,
    Open = 1,
    Closing = 2,
    Closed = 3
}
interface SSEMessage {
    event: string;
    data: string;
    id?: string;
    retry?: number;
}
type SSEEventListener = (message: SSEMessage) => void;
interface SSEOptions {
    manual?: boolean;
    headers?: Record<string, string>;
    body?: Record<string, unknown> | string;
    onOpen?: (response: Response) => void;
    onMessage?: (message: SSEMessage) => void;
    onError?: (error: Error) => void;
    onClose?: () => void;
    /** 自定义事件监听，key 为事件名，value 为回调 */
    eventListeners?: Record<string, SSEEventListener>;
    plugins?: SSEPlugin[];
}
interface SSEResult {
    latestMessage?: SSEMessage;
    connect: (body?: Record<string, unknown> | string) => void;
    disconnect: () => void;
    readyState: ReadyState;
}
interface SSEPluginContext {
    url: string;
    setHeader: (key: string, value: string) => void;
    getReadyState: () => ReadyState;
    getAbortController: () => AbortController | undefined;
    disconnect: () => void;
    connect: (body?: Record<string, unknown> | string) => void;
}
interface SSEPluginHooks {
    beforeConnect?: (ctx: SSEPluginContext) => void;
    onOpen?: (response: Response, ctx: SSEPluginContext) => void;
    onMessage?: (message: SSEMessage, ctx: SSEPluginContext) => SSEMessage | void;
    onError?: (error: Error, ctx: SSEPluginContext) => void;
    onClose?: (ctx: SSEPluginContext) => void;
}
type SSEPlugin = (ctx: SSEPluginContext) => SSEPluginHooks;

declare function useSSE(url: string, options?: SSEOptions): SSEResult;

interface RetryOptions {
    maxRetries?: number;
    interval?: number;
}
declare function retryPlugin(options?: RetryOptions): SSEPlugin;

interface AuthOptions {
    token: string | (() => string);
    headerName?: string;
    prefix?: string;
}
declare function authPlugin(options: AuthOptions): SSEPlugin;

interface LogOptions {
    prefix?: string;
}
declare function logPlugin(options?: LogOptions): SSEPlugin;

interface ChatMessage$1 {
    role: 'user' | 'assistant';
    content: string;
}
interface UseChatOptions {
    url: string;
}
declare function useChat(options: UseChatOptions): {
    messages: ChatMessage$1[];
    streamingText: string;
    send: (content: string) => void;
    disconnect: () => void;
    isLoading: boolean;
    readyState: ReadyState;
};

type EventStatus = 'idle' | 'start' | 'done';
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
interface UseChatWithEventsOptions {
    url: string;
}
declare function useChatWithEvents(options: UseChatWithEventsOptions): {
    messages: ChatMessage[];
    streamingText: string;
    status: EventStatus;
    thinkingText: string;
    send: (content: string) => void;
    disconnect: () => void;
    isLoading: boolean;
    readyState: ReadyState;
};

export { type AuthOptions, type ChatMessage$1 as ChatMessage, type EventStatus, type LogOptions, ReadyState, type RetryOptions, type SSEMessage, type SSEOptions, type SSEPlugin, type SSEPluginContext, type SSEPluginHooks, type SSEResult, type UseChatOptions, type UseChatWithEventsOptions, authPlugin, logPlugin, retryPlugin, useChat, useChatWithEvents, useSSE };
