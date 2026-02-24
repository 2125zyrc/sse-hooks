import type { SSEPlugin } from '../types';

export interface AuthOptions {
  token: string | (() => string);
  headerName?: string;
  prefix?: string;
}

export function authPlugin(options: AuthOptions): SSEPlugin {
  return (ctx) => ({
    beforeConnect() {
      const { headerName = 'Authorization', prefix = 'Bearer' } = options;
      const raw = typeof options.token === 'function' ? options.token() : options.token;
      ctx.setHeader(headerName, `${prefix} ${raw}`);
    },
  });
}
