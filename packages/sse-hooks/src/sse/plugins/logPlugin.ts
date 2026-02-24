import type { SSEPlugin } from '../types';

export interface LogOptions {
  prefix?: string;
}

export function logPlugin(options?: LogOptions): SSEPlugin {
  const tag = options?.prefix ?? '[SSE]';
  return () => ({
    beforeConnect(ctx) {
      console.log(tag, 'connecting to', ctx.url);
    },
    onOpen(response) {
      console.log(tag, 'connected, status:', response.status);
    },
    onMessage(message) {
      console.log(tag, 'message:', message.event, message.data);
    },
    onError(error) {
      console.error(tag, 'error:', error.message);
    },
    onClose() {
      console.log(tag, 'closed');
    },
  });
}
