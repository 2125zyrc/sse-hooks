import { useEffect, useRef, useState } from 'react';
import { createParser } from 'eventsource-parser';
import { useLatest, useMemoizedFn, useUnmount } from './utils';
import type {
  SSEMessage,
  SSEOptions,
  SSEResult,
  SSEPluginContext,
  SSEPluginHooks,
} from './types';
import { ReadyState } from './types';

export function useSSE(url: string, options: SSEOptions = {}): SSEResult {
  const {
    manual = false,
    headers,
    body: defaultBody,
    onOpen,
    onMessage,
    onError,
    onClose,
    eventListeners,
    plugins = [],
  } = options;

  const [latestMessage, setLatestMessage] = useState<SSEMessage>();
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.Closed);

  const onOpenRef = useLatest(onOpen);
  const onMessageRef = useLatest(onMessage);
  const onErrorRef = useLatest(onError);
  const onCloseRef = useLatest(onClose);
  const eventListenersRef = useLatest(eventListeners);
  const readyStateRef = useLatest(readyState);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pluginHooksRef = useRef<SSEPluginHooks[]>([]);
  const pluginCtxRef = useRef<SSEPluginContext | null>(null);

  const pluginHeadersRef = useRef<Record<string, string>>({});

  const handleMessage = (message: SSEMessage) => {
    let msg: SSEMessage = message;
    for (const h of pluginHooksRef.current) {
      const result = h.onMessage?.(msg, pluginCtxRef.current!);
      if (result === null) return;
      if (result) msg = result;
    }
    const listeners = eventListenersRef.current;
    if (listeners && msg.event && listeners[msg.event]) {
      listeners[msg.event](msg);
    }
    onMessageRef.current?.(msg);
    setLatestMessage(msg);
  };

  const connectSSE = (body?: Record<string, unknown> | string) => {
    abortControllerRef.current?.abort();
    const ac = new AbortController();
    abortControllerRef.current = ac;
    setReadyState(ReadyState.Connecting);
    pluginHeadersRef.current = {};
    pluginHooksRef.current.forEach((h) => h.beforeConnect?.(pluginCtxRef.current!));
    const reqBody = body ?? defaultBody;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers, ...pluginHeadersRef.current },
      body: typeof reqBody === 'string' ? reqBody : JSON.stringify(reqBody),
      signal: ac.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`SSE request failed: ${response.status}`);
        if (!response.body) throw new Error('Response body is empty');
        setReadyState(ReadyState.Open);
        onOpenRef.current?.(response);
        pluginHooksRef.current.forEach((h) => h.onOpen?.(response, pluginCtxRef.current!));
        const parser = createParser({
          onEvent(event) {
            handleMessage({ event: event.event ?? 'message', data: event.data, id: event.id });
          },
        });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parser.feed(decoder.decode(value, { stream: true }));
        }
        parser.reset();
        setReadyState(ReadyState.Closed);
        onCloseRef.current?.();
        pluginHooksRef.current.forEach((h) => h.onClose?.(pluginCtxRef.current!));
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setReadyState(ReadyState.Closed);
        onErrorRef.current?.(err);
        pluginHooksRef.current.forEach((h) => h.onError?.(err, pluginCtxRef.current!));
      });
  };

  const disconnectSSE = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setReadyState(ReadyState.Closed);
    onCloseRef.current?.();
    pluginHooksRef.current.forEach((h) => h.onClose?.(pluginCtxRef.current!));
  };

  // init plugin context & plugins in effect to satisfy React 19 ref rules
  useEffect(() => {
    pluginCtxRef.current = {
      url,
      setHeader: (key: string, value: string) => { pluginHeadersRef.current[key] = value; },
      getReadyState: () => readyStateRef.current,
      getAbortController: () => abortControllerRef.current ?? undefined,
      disconnect: () => disconnectSSE(),
      connect: (b?) => connectSSE(b),
    };
    pluginHooksRef.current = plugins.map((p) => p(pluginCtxRef.current!));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pluginCtxRef.current) pluginCtxRef.current.url = url;
  }, [url]);

  useEffect(() => {
    if (!manual && url) connectSSE();
  }, [url, manual]); // eslint-disable-line react-hooks/exhaustive-deps

  useUnmount(() => disconnectSSE());

  return {
    latestMessage,
    connect: useMemoizedFn(connectSSE),
    disconnect: useMemoizedFn(disconnectSSE),
    readyState,
  };
}