"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SseController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let SseController = class SseController {
    stream() {
        const chars = '你好，这是一个 SSE 流式响应的演示，文字会逐字出现。'.split('');
        return new rxjs_1.Observable((subscriber) => {
            let i = 0;
            const timer = setInterval(() => {
                if (i < chars.length) {
                    subscriber.next({ data: { content: chars[i] } });
                    i++;
                }
                else {
                    subscriber.next({ data: { content: '[DONE]' } });
                    subscriber.complete();
                    clearInterval(timer);
                }
            }, 150);
            return () => clearInterval(timer);
        });
    }
    async streamPost(body, res) {
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
    async streamWithEvents(body, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const text = body?.prompt || '你好，这是自定义事件类型的演示。';
        const chars = text.split('');
        res.write(`event: status\ndata: ${JSON.stringify({ status: 'start' })}\n\n`);
        await delay(300);
        res.write(`event: thinking\ndata: ${JSON.stringify({ text: '思考中...' })}\n\n`);
        await delay(800);
        res.write(`event: thinking\ndata: ${JSON.stringify({ text: '组织语言...' })}\n\n`);
        await delay(500);
        for (let i = 0; i < chars.length; i++) {
            res.write(`data: ${JSON.stringify({ content: chars[i] })}\n\n`);
            await delay(150);
        }
        res.write(`event: status\ndata: ${JSON.stringify({ status: 'done' })}\n\n`);
        res.end();
    }
};
exports.SseController = SseController;
__decorate([
    (0, common_1.Sse)('stream'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", rxjs_1.Observable)
], SseController.prototype, "stream", null);
__decorate([
    (0, common_1.Post)('stream'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SseController.prototype, "streamPost", null);
__decorate([
    (0, common_1.Post)('stream-events'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SseController.prototype, "streamWithEvents", null);
exports.SseController = SseController = __decorate([
    (0, common_1.Controller)('sse')
], SseController);
//# sourceMappingURL=sse.controller.js.map