export enum ReadyState {
  Connecting = 0,
  Open = 1,
  Closing = 2,
  Closed = 3,
}

export interface SSEMessage {
  event: string;
  data: string;
  id?: string;
  retry?: number;
}

export type SSEEventListener = (message: SSEMessage) => void;

export interface SSEOptions {
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

export interface SSEResult {
  latestMessage?: SSEMessage;
  connect: (body?: Record<string, unknown> | string) => void;
  disconnect: () => void;
  readyState: ReadyState;
}

export interface SSEPluginContext {
  url: string;
  setHeader: (key: string, value: string) => void;
  getReadyState: () => ReadyState;
  getAbortController: () => AbortController | undefined;
  disconnect: () => void;
  connect: (body?: Record<string, unknown> | string) => void;
}

export interface SSEPluginHooks {
  beforeConnect?: (ctx: SSEPluginContext) => void;
  onOpen?: (response: Response, ctx: SSEPluginContext) => void;
  onMessage?: (message: SSEMessage, ctx: SSEPluginContext) => SSEMessage | void;
  onError?: (error: Error, ctx: SSEPluginContext) => void;
  onClose?: (ctx: SSEPluginContext) => void;
}

export type SSEPlugin = (ctx: SSEPluginContext) => SSEPluginHooks;
