// src/sse/useSSE.ts
import { useEffect as useEffect2, useRef as useRef2, useState } from "react";
import { createParser } from "eventsource-parser";

// src/sse/utils.ts
import { useCallback, useEffect, useRef } from "react";
function useLatest(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
function useMemoizedFn(fn) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const memoizedFn = useCallback((...args) => {
    return fnRef.current(...args);
  }, []);
  return memoizedFn;
}
function useUnmount(fn) {
  const fnRef = useLatest(fn);
  useEffect(() => {
    return () => {
      fnRef.current();
    };
  }, []);
}

// src/sse/types.ts
var ReadyState = /* @__PURE__ */ ((ReadyState2) => {
  ReadyState2[ReadyState2["Connecting"] = 0] = "Connecting";
  ReadyState2[ReadyState2["Open"] = 1] = "Open";
  ReadyState2[ReadyState2["Closing"] = 2] = "Closing";
  ReadyState2[ReadyState2["Closed"] = 3] = "Closed";
  return ReadyState2;
})(ReadyState || {});

// src/sse/useSSE.ts
function useSSE(url, options = {}) {
  const {
    manual = false,
    headers,
    body: defaultBody,
    onOpen,
    onMessage,
    onError,
    onClose,
    eventListeners,
    plugins = []
  } = options;
  const [latestMessage, setLatestMessage] = useState();
  const [readyState, setReadyState] = useState(3 /* Closed */);
  const onOpenRef = useLatest(onOpen);
  const onMessageRef = useLatest(onMessage);
  const onErrorRef = useLatest(onError);
  const onCloseRef = useLatest(onClose);
  const eventListenersRef = useLatest(eventListeners);
  const readyStateRef = useLatest(readyState);
  const abortControllerRef = useRef2(null);
  const pluginHooksRef = useRef2([]);
  const pluginCtxRef = useRef2(null);
  const pluginHeadersRef = useRef2({});
  const handleMessage = (message) => {
    let msg = message;
    for (const h of pluginHooksRef.current) {
      const result = h.onMessage?.(msg, pluginCtxRef.current);
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
  const connectSSE = (body) => {
    abortControllerRef.current?.abort();
    const ac = new AbortController();
    abortControllerRef.current = ac;
    setReadyState(0 /* Connecting */);
    pluginHeadersRef.current = {};
    pluginHooksRef.current.forEach((h) => h.beforeConnect?.(pluginCtxRef.current));
    const reqBody = body ?? defaultBody;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers, ...pluginHeadersRef.current },
      body: typeof reqBody === "string" ? reqBody : JSON.stringify(reqBody),
      signal: ac.signal
    }).then(async (response) => {
      if (!response.ok) throw new Error(`SSE request failed: ${response.status}`);
      if (!response.body) throw new Error("Response body is empty");
      setReadyState(1 /* Open */);
      onOpenRef.current?.(response);
      pluginHooksRef.current.forEach((h) => h.onOpen?.(response, pluginCtxRef.current));
      const parser = createParser({
        onEvent(event) {
          handleMessage({ event: event.event ?? "message", data: event.data, id: event.id });
        }
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (; ; ) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
      }
      parser.reset();
      setReadyState(3 /* Closed */);
      onCloseRef.current?.();
      pluginHooksRef.current.forEach((h) => h.onClose?.(pluginCtxRef.current));
    }).catch((err) => {
      if (err.name === "AbortError") return;
      setReadyState(3 /* Closed */);
      onErrorRef.current?.(err);
      pluginHooksRef.current.forEach((h) => h.onError?.(err, pluginCtxRef.current));
    });
  };
  const disconnectSSE = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setReadyState(3 /* Closed */);
    onCloseRef.current?.();
    pluginHooksRef.current.forEach((h) => h.onClose?.(pluginCtxRef.current));
  };
  useEffect2(() => {
    pluginCtxRef.current = {
      url,
      setHeader: (key, value) => {
        pluginHeadersRef.current[key] = value;
      },
      getReadyState: () => readyStateRef.current,
      getAbortController: () => abortControllerRef.current ?? void 0,
      disconnect: () => disconnectSSE(),
      connect: (b) => connectSSE(b)
    };
    pluginHooksRef.current = plugins.map((p) => p(pluginCtxRef.current));
  }, []);
  useEffect2(() => {
    if (pluginCtxRef.current) pluginCtxRef.current.url = url;
  }, [url]);
  useEffect2(() => {
    if (!manual && url) connectSSE();
  }, [url, manual]);
  useUnmount(() => disconnectSSE());
  return {
    latestMessage,
    connect: useMemoizedFn(connectSSE),
    disconnect: useMemoizedFn(disconnectSSE),
    readyState
  };
}

// src/sse/plugins/retryPlugin.ts
function retryPlugin(options) {
  const { maxRetries = 3, interval = 3e3 } = options ?? {};
  return (ctx) => {
    let retryCount = 0;
    let timer;
    return {
      beforeConnect() {
        retryCount = 0;
        if (timer) {
          clearTimeout(timer);
          timer = void 0;
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
          timer = void 0;
        }
      }
    };
  };
}

// src/sse/plugins/authPlugin.ts
function authPlugin(options) {
  return (ctx) => ({
    beforeConnect() {
      const { headerName = "Authorization", prefix = "Bearer" } = options;
      const raw = typeof options.token === "function" ? options.token() : options.token;
      ctx.setHeader(headerName, `${prefix} ${raw}`);
    }
  });
}

// src/sse/plugins/logPlugin.ts
function logPlugin(options) {
  const tag = options?.prefix ?? "[SSE]";
  return () => ({
    beforeConnect(ctx) {
      console.log(tag, "connecting to", ctx.url);
    },
    onOpen(response) {
      console.log(tag, "connected, status:", response.status);
    },
    onMessage(message) {
      console.log(tag, "message:", message.event, message.data);
    },
    onError(error) {
      console.error(tag, "error:", error.message);
    },
    onClose() {
      console.log(tag, "closed");
    }
  });
}

// src/chat/useChat.ts
import { useCallback as useCallback2, useState as useState2 } from "react";
function useChat(options) {
  const { url } = options;
  const [messages, setMessages] = useState2([]);
  const [streamingText, setStreamingText] = useState2("");
  const plugins = [
    logPlugin({ prefix: "[xxxx===]" }),
    authPlugin({ token: "123456" }),
    retryPlugin({ maxRetries: 2, interval: 2e3 })
  ];
  const { connect, disconnect, readyState } = useSSE(url, {
    manual: true,
    onOpen() {
      setStreamingText("");
    },
    onMessage(msg) {
      if (msg.data === "[DONE]") return;
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
          setMessages((msgs) => [...msgs, { role: "assistant", content: prev }]);
        }
        return "";
      });
    },
    onError(err) {
      console.error("[Chat] error:", err.message);
    },
    plugins
  });
  const send = useCallback2(
    (content) => {
      setMessages((prev) => [...prev, { role: "user", content }]);
      setStreamingText("");
      connect({ prompt: content });
    },
    [connect]
  );
  const isLoading = readyState === 0 /* Connecting */ || readyState === 1 /* Open */;
  return {
    messages,
    streamingText,
    send,
    disconnect,
    isLoading,
    readyState
  };
}

// src/chat/useChatWithEvents.ts
import { useCallback as useCallback3, useState as useState3 } from "react";
function useChatWithEvents(options) {
  const { url } = options;
  const [messages, setMessages] = useState3([]);
  const [streamingText, setStreamingText] = useState3("");
  const [status, setStatus] = useState3("idle");
  const [thinkingText, setThinkingText] = useState3("");
  const plugins = [
    logPlugin({ prefix: "[Events]" }),
    authPlugin({ token: "123456" }),
    retryPlugin({ maxRetries: 2, interval: 2e3 })
  ];
  const { connect, disconnect, readyState } = useSSE(url, {
    manual: true,
    onOpen() {
      setStreamingText("");
      setThinkingText("");
      setStatus("idle");
    },
    onClose() {
      setStreamingText((prev) => {
        if (prev) {
          setMessages((msgs) => [
            ...msgs,
            { role: "assistant", content: prev }
          ]);
        }
        return "";
      });
    },
    onError(err) {
      console.error("[ChatWithEvents] error:", err.message);
    },
    eventListeners: {
      status: (msg) => {
        try {
          const parsed = JSON.parse(msg.data);
          setStatus(parsed.status);
          console.log("[status event]", parsed.status);
        } catch {
          console.warn("[status] parse error:", msg.data);
        }
      },
      thinking: (msg) => {
        try {
          const parsed = JSON.parse(msg.data);
          setThinkingText(parsed.text);
          console.log("[thinking event]", parsed.text);
        } catch {
          console.warn("[thinking] parse error:", msg.data);
        }
      },
      message: (msg) => {
        try {
          const parsed = JSON.parse(msg.data);
          setStreamingText((prev) => prev + parsed.content);
        } catch {
          setStreamingText((prev) => prev + msg.data);
        }
      }
    },
    plugins
  });
  const send = useCallback3(
    (content) => {
      setMessages((prev) => [...prev, { role: "user", content }]);
      setStreamingText("");
      setThinkingText("");
      setStatus("idle");
      connect({ prompt: content });
    },
    [connect]
  );
  const isLoading = readyState === 0 /* Connecting */ || readyState === 1 /* Open */;
  return {
    messages,
    streamingText,
    status,
    thinkingText,
    send,
    disconnect,
    isLoading,
    readyState
  };
}
export {
  ReadyState,
  authPlugin,
  logPlugin,
  retryPlugin,
  useChat,
  useChatWithEvents,
  useSSE
};
