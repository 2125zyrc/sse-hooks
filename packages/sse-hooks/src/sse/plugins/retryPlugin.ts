import type { SSEPlugin, SSEPluginContext } from '../types';

export interface RetryOptions {
  maxRetries?: number;
  interval?: number;
}

export function retryPlugin(options?: RetryOptions): SSEPlugin {
  const { maxRetries = 3, interval = 3000 } = options ?? {};

  return (ctx: SSEPluginContext) => {
    let retryCount = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    return {
      beforeConnect() {
        retryCount = 0;
        if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      onOpen() {
        retryCount = 0;
      },
      onError() {
        if (retryCount < maxRetries) {
          timer = setTimeout(() => {
            retryCount++;
            ctx.connect();
          }, interval);
        }
      },
      onClose() {
        if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
    };
  };
}
