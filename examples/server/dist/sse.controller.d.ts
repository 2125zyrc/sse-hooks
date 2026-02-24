import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Response } from 'express';
export declare class SseController {
    stream(): Observable<MessageEvent>;
    streamPost(body: {
        prompt?: string;
    }, res: Response): Promise<void>;
    streamWithEvents(body: {
        prompt?: string;
    }, res: Response): Promise<void>;
}
