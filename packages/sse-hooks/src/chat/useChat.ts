import { useCallback, useState } from 'react';
import {
  useSSE,
  ReadyState,
  retryPlugin,
  logPlugin,
  authPlugin
} from '../sse';
import type { SSEMessage } from '../sse';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UseChatOptions {
  url: string;
}

export function useChat(options: UseChatOptions) {
  const { url } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');

  const plugins = [
    logPlugin({ prefix: '[xxxx===]' }),
    authPlugin({token: '123456'}),
    retryPlugin({ maxRetries: 2, interval: 2000 }),
  ];

  const { connect, disconnect, readyState } = useSSE(url, {
    manual: true,
    onOpen() {
      setStreamingText('');
    },
    onMessage(msg: SSEMessage) {
      if (msg.data === '[DONE]') return;
      try {
        const parsed = JSON.parse(msg.data);
        setStreamingText((prev) => prev + parsed.content);
      } catch {
        setStreamingText((prev) => prev + msg.data);
      }
    },
    onClose() {
      setStreamingText((prev) => {
        if (prev) {
          setMessages((msgs) => [...msgs, { role: 'assistant', content: prev }]);
        }
        return '';
      });
    },
    onError(err) {
      console.error('[Chat] error:', err.message);
    },
    plugins,
  });

  const send = useCallback(
    (content: string) => {
      setMessages((prev) => [...prev, { role: 'user', content }]);
      setStreamingText('');
      connect({ prompt: content });
    },
    [connect],
  );

  const isLoading = readyState === ReadyState.Connecting || readyState === ReadyState.Open;

  return {
    messages,
    streamingText,
    send,
    disconnect,
    isLoading,
    readyState,
  };
}
