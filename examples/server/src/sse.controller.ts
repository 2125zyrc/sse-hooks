import { Controller, Sse, Post, Body, Res, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Response } from 'express';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Controller('sse')
export class SseController {
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    const chars = '你好，这是一个 SSE 流式响应的演示，文字会逐字出现。'.split('');

    return new Observable((subscriber) => {
      let i = 0;
      const timer = setInterval(() => {
        if (i < chars.length) {
          subscriber.next({ data: { content: chars[i] } } as MessageEvent);
          i++;
        } else {
          subscriber.next({ data: { content: '[DONE]' } } as MessageEvent);
          subscriber.complete();
          clearInterval(timer);
        }
      }, 150);

      return () => clearInterval(timer);
    });
  }

  @Post('stream')
  async streamPost(
    @Body() body: { prompt?: string },
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const text = body?.prompt || '你好，这是 POST SSE 流式响应的演示。';
    const chars = text.split('');

    for (let i = 0; i < chars.length; i++) {
      res.write(`data: ${JSON.stringify({ content: chars[i] })}\n\n`);
      await delay(150);
    }
    res.write(`data: [DONE]\n\n`);
    res.end();
  }

  @Post('stream-events')
  async streamWithEvents(
    @Body() body: { prompt?: string },
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const text = body?.prompt || '你好，这是自定义事件类型的演示。';
    const chars = text.split('');

    // status: start
    res.write(
      `event: status\ndata: ${JSON.stringify({ status: 'start' })}\n\n`,
    );
    await delay(300);

    // thinking
    res.write(
      `event: thinking\ndata: ${JSON.stringify({ text: '思考中...' })}\n\n`,
    );
    await delay(800);

    res.write(
      `event: thinking\ndata: ${JSON.stringify({ text: '组织语言...' })}\n\n`,
    );
    await delay(500);

    // 正文逐字输出（默认 message 事件）
    for (let i = 0; i < chars.length; i++) {
      res.write(`data: ${JSON.stringify({ content: chars[i] })}\n\n`);
      await delay(150);
    }

    // status: done
    res.write(`event: status\ndata: ${JSON.stringify({ status: 'done' })}\n\n`);
    res.end();
  }
}
