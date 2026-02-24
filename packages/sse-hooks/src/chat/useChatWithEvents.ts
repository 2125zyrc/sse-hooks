import { useCallback, useState } from 'react';
import {
  useSSE,
  ReadyState,
  retryPlugin,
  logPlugin,
  authPlugin,
} from '../sse';
import type { SSEMessage } from '../sse';

export type EventStatus = 'idle' | 'start' | 'done';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UseChatWithEventsOptions {
  url: string;
}

export function useChatWithEvents(options: UseChatWithEventsOptions) {
  const { url } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [status, setStatus] = useState<EventStatus>('idle');
  const [thinkingText, setThinkingText] = useState('');

  const plugins = [
    logPlugin({ prefix: '[Events]' }),
    authPlugin({ token: '123456' }),
    retryPlugin({ maxRetries: 2, interval: 2000 }),
  ];

  const { connect, disconnect, readyState } = useSSE(url, {
    manual: true,
    onOpen() {
      setStreamingText('');
      setThinkingText('');
      setStatus('idle');
    },
    onClose() {
      setStreamingText((prev) => {
        if (prev) {
          setMessages((msgs) => [
            ...msgs,
            { role: 'assistant', content: prev },
          ]);
        }
        return '';
      });
    },
    onError(err) {
      console.error('[ChatWithEvents] error:', err.message);
    },
    eventListeners: {
      status: (msg: SSEMessage) => {
        try {
          const parsed = JSON.parse(msg.data);
          setStatus(parsed.status);
          console.log('[status event]', parsed.status);
        } catch {
          console.warn('[status] parse error:', msg.data);
        }
      },
      thinking: (msg: SSEMessage) => {
        try {
          const parsed = JSON.parse(msg.data);
          setThinkingText(parsed.text);
          console.log('[thinking event]', parsed.text);
        } catch {
          console.warn('[thinking] parse error:', msg.data);
        }
      },
      message: (msg: SSEMessage) => {
        try {
          const parsed = JSON.parse(msg.data);
          setStreamingText((prev) => prev + parsed.content);
        } catch {
          setStreamingText((prev) => prev + msg.data);
        }
      },
    },
    plugins,
  });

  const send = useCallback(
    (content: string) => {
      setMessages((prev) => [...prev, { role: 'user', content }]);
      setStreamingText('');
      setThinkingText('');
      setStatus('idle');
      connect({ prompt: content });
    },
    [connect],
  );

  const isLoading =
    readyState === ReadyState.Connecting ||
    readyState === ReadyState.Open;

  return {
    messages,
    streamingText,
    status,
    thinkingText,
    send,
    disconnect,
    isLoading,
    readyState,
  };
}
