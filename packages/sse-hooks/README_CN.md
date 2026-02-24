# @zyrc/sse-hooks

[English](./README.md)

基于 POST 请求的 React SSE (Server-Sent Events) Hooks，支持插件系统。

与原生 `EventSource` API（仅支持 GET）不同，`@zyrc/sse-hooks` 使用 `fetch` + POST 建立 SSE 连接，适用于需要发送请求体的场景（如聊天提示词）。

## 特性

- 基于 `fetch` + `eventsource-parser` 的 POST SSE
- 插件系统，支持生命周期钩子
- 通过 `eventListeners` 支持自定义事件类型
- 内置插件：`authPlugin`、`retryPlugin`、`logPlugin`
- 高级封装：`useChat` / `useChatWithEvents`
- 完整的 TypeScript 类型支持
- 支持 React 18+

## 安装

```bash
npm install @zyrc/sse-hooks eventsource-parser
# 或
yarn add @zyrc/sse-hooks eventsource-parser
# 或
pnpm add @zyrc/sse-hooks eventsource-parser
```

## 快速开始

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
      <button onClick={() => connect({ prompt: '你好' })}>发送</button>
      <button onClick={disconnect}>停止</button>
      <p>状态: {readyState}</p>
      <p>最新消息: {latestMessage?.data}</p>
    </div>
  );
}
```

## 插件

插件通过 `plugins` 选项传入，可以介入 SSE 的完整生命周期。

### authPlugin

在每次请求前注入认证头。

```ts
import { useSSE, authPlugin } from '@zyrc/sse-hooks';

useSSE(url, {
  plugins: [
    authPlugin({
      token: 'your-token',       // 或 () => getToken()
      headerName: 'Authorization', // 默认值
      prefix: 'Bearer',           // 默认值
    }),
  ],
});
```

### retryPlugin

连接失败时自动重试。

```ts
import { useSSE, retryPlugin } from '@zyrc/sse-hooks';

useSSE(url, {
  plugins: [
    retryPlugin({
      maxRetries: 3,   // 默认: 3
      interval: 3000,  // 默认: 3000ms
    }),
  ],
});
```

### logPlugin

在控制台打印所有生命周期事件。

```ts
import { useSSE, logPlugin } from '@zyrc/sse-hooks';

useSSE(url, {
  plugins: [logPlugin({ prefix: '[MySSE]' })],
});
```

## 自定义事件类型

SSE 支持命名事件（`event: status`、`event: thinking` 等）。使用 `eventListeners` 分别处理：

```ts
useSSE(url, {
  eventListeners: {
    status: (msg) => console.log('状态:', msg.data),
    thinking: (msg) => console.log('思考中:', msg.data),
    message: (msg) => console.log('内容:', msg.data),
  },
});
```

## 编写自定义插件

插件是一个工厂函数，接收上下文对象，返回生命周期钩子：

```ts
import type { SSEPlugin } from '@zyrc/sse-hooks';

const myPlugin: SSEPlugin = (ctx) => ({
  beforeConnect() {
    ctx.setHeader('X-Custom', 'value');
  },
  onOpen(response) {
    console.log('已连接:', response.status);
  },
  onMessage(message) {
    // 返回修改后的消息，或 void 透传
    return { ...message, data: message.data.toUpperCase() };
  },
  onError(error) {
    console.error(error);
  },
  onClose() {
    console.log('结束');
  },
});
```

### 插件上下文 (`SSEPluginContext`)

| 属性/方法 | 说明 |
|---|---|
| `url` | 当前 SSE 端点 URL |
| `setHeader(key, value)` | 设置请求头（在 `beforeConnect` 中调用） |
| `getReadyState()` | 获取当前连接状态 |
| `getAbortController()` | 获取当前 AbortController |
| `connect(body?)` | 重新连接，可传入请求体 |
| `disconnect()` | 中断连接 |

## API 参考

### `useSSE(url, options?)`

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `manual` | `boolean` | `false` | 为 true 时不自动连接 |
| `headers` | `Record<string, string>` | - | 自定义请求头 |
| `body` | `object \| string` | - | 默认请求体 |
| `onOpen` | `(response: Response) => void` | - | 连接建立时回调 |
| `onMessage` | `(message: SSEMessage) => void` | - | 收到消息时回调 |
| `onError` | `(error: Error) => void` | - | 发生错误时回调 |
| `onClose` | `() => void` | - | 流结束时回调 |
| `eventListeners` | `Record<string, (msg) => void>` | - | 命名事件监听器 |
| `plugins` | `SSEPlugin[]` | `[]` | 插件列表 |

返回值：

| 字段 | 类型 | 说明 |
|---|---|---|
| `connect` | `(body?) => void` | 发起/重新连接 |
| `disconnect` | `() => void` | 中断连接 |
| `readyState` | `ReadyState` | 连接状态 (0-3) |
| `latestMessage` | `SSEMessage` | 最近一条消息 |

## License

MIT
