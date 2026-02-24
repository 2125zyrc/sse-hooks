# @zyrc/sse-hooks

[中文文档](./README_CN.md)

React hooks for Server-Sent Events (SSE) over POST requests, with a plugin system.

Unlike the native `EventSource` API (GET only), `@zyrc/sse-hooks` uses `fetch` + POST to establish SSE connections, making it suitable for scenarios that require sending request bodies (e.g., chat prompts).

## Features

- POST-based SSE via `fetch` + `eventsource-parser`
- Plugin system with lifecycle hooks
- Custom event type support via `eventListeners`
- Built-in plugins: `authPlugin`, `retryPlugin`, `logPlugin`
- Higher-level `useChat` / `useChatWithEvents` hooks
- Full TypeScript support
- Works with React 18+

## Install

```bash
npm install @zyrc/sse-hooks eventsource-parser
# or
yarn add @zyrc/sse-hooks eventsource-parser
# or
pnpm add @zyrc/sse-hooks eventsource-parser
```

## Quick Start

```tsx
import { useSSE } from '@zyrc/sse-hooks';

function App() {
  const { connect, disconnect, readyState, latestMessage } = useSSE(
    '/api/sse/stream',
    {
      manual: true,
      onMessage(msg) {
        console.log(msg.event, msg.data);
      },
    },
  );

  return (
    <div>
      <button onClick={() => connect({ prompt: 'Hello' })}>Send</button>
      <button onClick={disconnect}>Stop</button>
      <p>State: {readyState}</p>
      <p>Latest: {latestMessage?.data}</p>
    </div>
  );
}
```

## Plugins

Plugins hook into the SSE lifecycle. Pass them via the `plugins` option.

### authPlugin

Injects an authorization header before each request.

```ts
import { useSSE, authPlugin } from '@zyrc/sse-hooks';

useSSE(url, {
  plugins: [
    authPlugin({
      token: 'your-token',       // or () => getToken()
      headerName: 'Authorization', // default
      prefix: 'Bearer',           // default
    }),
  ],
});
```

### retryPlugin

Auto-retries on connection error.

```ts
import { useSSE, retryPlugin } from '@zyrc/sse-hooks';

useSSE(url, {
  plugins: [
    retryPlugin({
      maxRetries: 3,   // default: 3
      interval: 3000,  // default: 3000ms
    }),
  ],
});
```

### logPlugin

Logs all lifecycle events to the console.

```ts
import { useSSE, logPlugin } from '@zyrc/sse-hooks';

useSSE(url, {
  plugins: [logPlugin({ prefix: '[MySSE]' })],
});
```

## Custom Event Types

SSE supports named events (`event: status`, `event: thinking`, etc.). Use `eventListeners` to handle them separately:

```ts
useSSE(url, {
  eventListeners: {
    status: (msg) => console.log('status:', msg.data),
    thinking: (msg) => console.log('thinking:', msg.data),
    message: (msg) => console.log('content:', msg.data),
  },
});
```

## Writing a Custom Plugin

A plugin is a factory function that receives a context object and returns lifecycle hooks:

```ts
import type { SSEPlugin } from '@zyrc/sse-hooks';

const myPlugin: SSEPlugin = (ctx) => ({
  beforeConnect() {
    ctx.setHeader('X-Custom', 'value');
  },
  onOpen(response) {
    console.log('connected:', response.status);
  },
  onMessage(message) {
    // return a modified message, or void to pass through
    return { ...message, data: message.data.toUpperCase() };
  },
  onError(error) {
    console.error(error);
  },
  onClose() {
    console.log('done');
  },
});
```

### Plugin Context (`SSEPluginContext`)

| Method | Description |
|---|---|
| `url` | Current SSE endpoint URL |
| `setHeader(key, value)` | Set a request header (call in `beforeConnect`) |
| `getReadyState()` | Get current connection state |
| `getAbortController()` | Get the current AbortController |
| `connect(body?)` | Reconnect with optional body |
| `disconnect()` | Abort the connection |

## API Reference

### `useSSE(url, options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `manual` | `boolean` | `false` | If true, won't connect automatically |
| `headers` | `Record<string, string>` | - | Custom request headers |
| `body` | `object \| string` | - | Default request body |
| `onOpen` | `(response: Response) => void` | - | Called when connection opens |
| `onMessage` | `(message: SSEMessage) => void` | - | Called for each message |
| `onError` | `(error: Error) => void` | - | Called on error |
| `onClose` | `() => void` | - | Called when stream ends |
| `eventListeners` | `Record<string, (msg) => void>` | - | Listeners for named events |
| `plugins` | `SSEPlugin[]` | `[]` | Plugin list |

Returns:

| Field | Type | Description |
|---|---|---|
| `connect` | `(body?) => void` | Start/restart connection |
| `disconnect` | `() => void` | Abort connection |
| `readyState` | `ReadyState` | Connection state (0-3) |
| `latestMessage` | `SSEMessage` | Last received message |

## License

MIT
