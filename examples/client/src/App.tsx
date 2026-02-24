import { useState } from 'react';
// import { useChat } from '@zyrc/sse-hooks';
import { useChatWithEvents } from '@zyrc/sse-hooks';

function App() {
  const [input, setInput] = useState('你好，这是自定义事件类型的演示。');
  // const { messages, streamingText, send, disconnect, isLoading } = useChat({
  //   url: 'http://localhost:3000/sse/stream',
  // });
  const {
    messages,
    streamingText,
    status,
    thinkingText,
    send,
    disconnect,
    isLoading,
  } = useChatWithEvents({
    url: 'http://localhost:3000/sse/stream-events',
  });

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>SSE 自定义事件 Demo (POST + useChatWithEvents)</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: 4 }}
        />
        <button onClick={() => send(input)} disabled={isLoading}>
          {isLoading ? '接收中...' : '发送'}
        </button>
        <button onClick={disconnect} disabled={!isLoading}>
          断开
        </button>
      </div>
      <div style={{ marginTop: 12, fontSize: 14, color: '#888' }}>
        status: <strong>{status}</strong>
        {thinkingText && <span> | thinking: {thinkingText}</span>}
      </div>
      <div style={{ marginTop: 16, whiteSpace: 'pre-wrap', minHeight: 40 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
        {streamingText && (
          <div>
            <strong>assistant:</strong> {streamingText}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
